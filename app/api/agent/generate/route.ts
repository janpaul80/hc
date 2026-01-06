import { createServiceClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { AIEngine, ModelID } from "@/lib/ai/engine";
import { auth } from "@clerk/nextjs/server";
import { ActionParser } from "@/lib/agent/parser";
import { IntentClassifier, UserIntent } from "@/lib/agent/intent";
import { ConversationalAgent } from "@/lib/agent/conversational";
import { WorkspaceState } from "@/types/workspace";

export async function POST(req: Request) {
    const { userId: clerkId } = await auth();

    // 1. Authenticate User (via Clerk)
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    const body = await req.json();
    const { projectId, prompt, model, fileContext, workspaceState } = body;

    console.log("[AIEngine] Incoming request", {
        model,
        projectId,
        prompt: prompt.substring(0, 100) + "...",
        origin: req.headers.get("origin"),
        referer: req.headers.get("referer"),
        ip: req.headers.get("x-forwarded-for"),
        userAgent: req.headers.get("user-agent")
    });

    // 2. Classify user intent
    const intent = IntentClassifier.classify(prompt);
    const mode = ConversationalAgent.intentToMode(intent, workspaceState || {
        id: projectId,
        currentPlan: null,
        planStatus: "none"
    });

    console.log("[Intent] Classified as:", intent, "Mode:", mode);

    // 3. Hard rule: Do not write files unless CODE_REQUEST or APPROVAL
    if (!IntentClassifier.shouldModifyFiles(intent)) {
        // For non-code intents, return chat response only
        const chatResponse = getChatResponse(intent, prompt);

        return NextResponse.json({
            success: true,
            intent,
            mode,
            response: {
                type: "chat",
                content: chatResponse
            },
            shouldModifyFiles: false
        });
    }

    // 4. Check if plan is approved for code generation
    if (intent === UserIntent.CODE_REQUEST && workspaceState?.planStatus !== "approved") {
        return NextResponse.json({
            success: true,
            intent,
            mode,
            response: {
                type: "chat",
                content: "I need to create a plan first. Please describe what you want to build, and I'll propose a plan for your approval."
            },
            shouldModifyFiles: false
        });
    }

    // 5. Get User from Supabase and Check Credits
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, credits")
        .eq("clerk_id", clerkId)
        .single();

    if (userError || !userData) {
        return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const isImage = model === "flux.2-pro";
    const cost = isImage ? 50 : 5;

    if (userData.credits < cost) {
        return NextResponse.json({ error: `Insufficient credits (Need ${cost})` }, { status: 403 });
    }

    try {
        // 6. Call AI Engine for code generation
        const result = await AIEngine.generate(model as ModelID, prompt, fileContext);

        let content;
        let imageUrl;
        let agentResponse;

        if (isImage) {
            const parsed = JSON.parse(result.content);
            imageUrl = parsed.url;
            const fileName = `public/assets/gen-${Date.now()}.png`;
            content = { [fileName]: `IMAGE_ASSET:${imageUrl}` };

            agentResponse = {
                conversationText: "Generated image",
                actions: [],
                requiresConfirmation: false
            };
        } else {
            try {
                content = JSON.parse(result.content);

                // Parse into structured actions
                agentResponse = ActionParser.parseResponse(content);

            } catch (e) {
                return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
            }
        }

        // 7. Update Supabase (Merge JSON)
        const { data: project } = await supabase
            .from("projects")
            .select("files")
            .eq("id", projectId)
            .single();

        const newFiles = { ...project?.files, ...content };

        await supabase
            .from("projects")
            .update({
                files: newFiles,
                last_modified: Date.now()
            })
            .eq("id", projectId);

        // 8. Deduct Credits
        const { error: rpcError } = await supabase.rpc('decrement_credits', {
            target_user_id: userData.id,
            amount: cost
        });

        if (rpcError) {
            console.error("RPC Credit Deduction Failed, falling back to patch:", rpcError);
            await supabase
                .from("users")
                .update({ credits: Math.max(0, userData.credits - cost) })
                .eq("id", userData.id);
        }

        return NextResponse.json({
            success: true,
            intent,
            mode,
            changes: content,
            content: JSON.stringify(content),
            imageUrl,
            failover: result.failover,
            agentResponse,
            shouldModifyFiles: true
        });

    } catch (error: any) {
        console.error("API Agent Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Get chat response for non-code intents
 */
function getChatResponse(intent: UserIntent, prompt: string): string {
    switch (intent) {
        case UserIntent.GREETING:
            return "Hello! I'm your AI assistant in the HeftCoder workspace. How can I help you build something today?";

        case UserIntent.QUESTION:
            return "I'd be happy to help answer your questions. For building projects, please describe what you want to create and I'll propose a plan first.";

        case UserIntent.PLAN_REQUEST:
            return "Great! I'll create a plan for your project. Let me think through the requirements and propose a structured approach.";

        case UserIntent.EDIT_PLAN:
            return "I can help you modify the current plan. What changes would you like to make?";

        default:
            return "I'm here to help you build projects. Please describe what you'd like to create!";
    }
}
