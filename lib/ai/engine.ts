import { AzureOpenAI } from "openai";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const CONFIG = {
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, "")!,
    AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY!,
    AZURE_MAAS_ENDPOINT: (process.env.AZURE_MAAS_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT)?.replace(/\/+$/, "")!,
    AZURE_MAAS_KEY: process.env.AZURE_MAAS_KEY || process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY!,
    AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
    LANGDOCK_API_KEY: process.env.LANGDOCK_API_KEY!,
    LANGDOCK_ASSISTANT_ID: process.env.LANGDOCK_ASSISTANT_ID!,
    LANGDOCK_UI_ARCHITECT_ID: process.env.LANGDOCK_UI_ARCHITECT_ID || process.env.LANGDOCK_ASSISTANT_ID!,
    LANGDOCK_DEBUGGER_PRO_ID: process.env.LANGDOCK_DEBUGGER_PRO_ID || process.env.LANGDOCK_ASSISTANT_ID!,
    WATERMELON_API_KEY: process.env.WATERMELON_API_KEY!,
    WATERMELON_PLUS_ID: process.env.WATERMELON_PLUS_ID!
};

export type ModelID =
    | "heftcoder-pro"
    | "heftcoder-plus"
    | "ui-architect"
    | "debugger-pro"
    | "general-assistant"
    | "claude-4.5-sonnet"
    | "heft-orchestrator"
    | "mistral-large"
    | "flux.2-pro"
    | "sora";

interface AIResponse {
    content: string;
    usage?: { inputTokenCount: number; outputTokenCount: number };
    failover?: boolean;
}

export class AIEngine {

    private static getAzureClient(deployment: string) {
        return new AzureOpenAI({
            endpoint: CONFIG.AZURE_OPENAI_ENDPOINT,
            apiKey: CONFIG.AZURE_OPENAI_KEY,
            apiVersion: CONFIG.AZURE_OPENAI_API_VERSION,
            deployment: deployment,
        });
    }

    private static async runGPT5(prompt: string, context: string): Promise<AIResponse> {
        const client = this.getAzureClient(process.env.AZURE_DEPLOYMENT_HEFTCODER_ORCHESTRATOR || process.env.AZURE_DEPLOYMENT_GPT51 || "heftcoder-orchestrator");

        const response = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are HeftCoder, an expert full-stack builder. Return ONLY valid JSON representing file changes." },
                { role: "system", content: `Context: ${context}` },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            model: "", // AOAI handles this via deployment in path
        });

        return {
            content: response.choices[0].message.content || "{}",
            usage: response.usage ? {
                inputTokenCount: response.usage.prompt_tokens,
                outputTokenCount: response.usage.completion_tokens
            } : undefined,
        };
    }

    private static async runMaaS(modelId: string, prompt: string, context: string): Promise<AIResponse> {
        const deploymentMap: Record<string, string> = {
            "grok-4": process.env.AZURE_DEPLOYMENT_GROK || "grok-4-fast-reasoning",
            "deepseek-v3.1": process.env.AZURE_DEPLOYMENT_DEEPSEEK || "DeepSeek-V3.2",
            "mistral-medium": process.env.AZURE_DEPLOYMENT_MISTRAL_MEDIUM || "Mistral-Large-3", // Fallback to Large if Medium not deployed
            "mistral-large": process.env.AZURE_DEPLOYMENT_MISTRAL_LARGE || "Mistral-Large-3",
            "codestral": process.env.AZURE_DEPLOYMENT_CODESTRAL || process.env.AZURE_DEPLOYMENT_MISTRAL || "Codestral-2501",
            "llama-4": process.env.AZURE_DEPLOYMENT_LLAMA_MAVERICK || process.env.AZURE_DEPLOYMENT_LLAMA || "Llama-4-Maverick-17B-128E-Instruct-FP8",
            "kimi-k2": process.env.AZURE_DEPLOYMENT_KIMI || process.env.AZURE_DEPLOYMENT_GPT51 || "Kimi-K2-Thinking"
        };

        const deploymentName = deploymentMap[modelId];
        const client = this.getAzureClient(deploymentName);

        try {
            const response = await client.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a coding assistant. Return valid JSON only. If you are a reasoning model, finish your internal thinking before outputting the final JSON." },
                    { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                ],
                temperature: (modelId === "grok-4" || modelId === "llama-4" || modelId === "kimi-k2") ? 0.3 : 0.1,
                max_tokens: 4096,
                model: "", // AOAI handles this via deployment in path
            });

            let raw = response.choices[0].message.content || "";
            // Reasoning models cleanup
            raw = raw.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();
            raw = raw.replace(/```json/g, "").replace(/```/g, "");

            return {
                content: raw,
                usage: response.usage ? {
                    inputTokenCount: response.usage.prompt_tokens,
                    outputTokenCount: response.usage.completion_tokens
                } : undefined,
            };
        } catch (error: any) {
            const errorMessage = error?.response?.body
                ? JSON.stringify(error.response.body)
                : (error.message || "Unknown Azure Error");
            throw new Error(`MaaS Error [${deploymentName}]: ${errorMessage}`);
        }
    }

    private static async runFlux(prompt: string): Promise<AIResponse> {
        const deploymentName = process.env.AZURE_DEPLOYMENT_FLUX || "FLUX.2-pro";
        const client = this.getAzureClient(deploymentName);

        try {
            const response = await client.images.generate({
                prompt: prompt,
                size: "1024x1024",
                n: 1,
                model: "", // AOAI handles this via deployment in path
            });

            if (!response.data || response.data.length === 0) {
                throw new Error("Azure returned no image data");
            }

            return { content: JSON.stringify({ url: response.data[0].url }) };
        } catch (error: any) {
            throw new Error(`Flux Gen Failed [${deploymentName}]: ${error.message}`);
        }
    }

    private static async runSora(prompt: string): Promise<AIResponse> {
        const deploymentName = process.env.AZURE_DEPLOYMENT_SORA || "sora";
        // Sora on AOAI typically uses a specific preview SDK or endpoint, 
        // but for now we follow the same deployment pattern.
        return { content: JSON.stringify({ url: "#", message: `Sora video generation (Mock: using deployment ${deploymentName})` }) };
    }

    private static async runLangdock(prompt: string, context: string, assistantId?: string, extendedThinking: boolean = false, systemInstruction?: string): Promise<AIResponse> {
        try {
            const body: any = {
                assistantId: assistantId || CONFIG.LANGDOCK_ASSISTANT_ID,
                messages: [
                    { role: "system", content: systemInstruction || "You are HeftCoder Pro, the most advanced AI orchestrator. ENFORCE NO-PROSE: Return ONLY valid JSON representing file changes. No explanations." },
                    { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                ],
                // model: "claude-4.5-sonnet" // Omit model when assistantId is used to avoid conflicts
            };

            if (extendedThinking) {
                body.thinking = {
                    type: "enabled",
                    budget_tokens: 16000
                };
            }

            const response = await fetch("https://api.langdock.com/assistant/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CONFIG.LANGDOCK_API_KEY}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`Langdock API Error Details [ID: ${body.assistantId}]:`, errText);
                throw new Error(`Langdock API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content || "{}";
            content = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();

            return { content, usage: data.usage };
        } catch (error: any) {
            console.error("Langdock Connectivity/Runtime Error:", error.message);
            throw new Error(`Langdock Integration Failed: ${error.message}`);
        }
    }

    private static async runWatermelon(prompt: string, context: string, assistantId?: string): Promise<AIResponse> {
        try {
            // Using public.watermelon.ai/v1/chat/completions (dropping /api)
            const response = await fetch("https://public.watermelon.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.WATERMELON_SECRET_KEY || CONFIG.WATERMELON_API_KEY}`
                },
                body: JSON.stringify({
                    assistantId: assistantId || CONFIG.WATERMELON_PLUS_ID,
                    messages: [
                        { role: "system", content: "You are HeftCoder Plus (GPT-5.1). Return ONLY valid JSON." },
                        { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                    ]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Watermelon API Error Details:", errText);
                throw new Error(`Watermelon API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            return {
                content: data.choices[0].message.content || "{}",
                usage: data.usage
            };
        } catch (error: any) {
            console.error("Watermelon Connectivity Error:", error.message);
            throw new Error(`Watermelon Integration Failed: ${error.message}`);
        }
    }

    private static parseSafeJSON(str: string): any {
        try {
            // Remove markdown formatting if present
            let clean = str.replace(/```json/g, "").replace(/```/g, "").trim();
            // Sometimes models add reasoning tags - we already handle that in runMaaS but let's be safe here too
            clean = clean.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();
            return JSON.parse(clean);
        } catch (e) {
            console.error("Failed to parse AI JSON:", str);
            throw new Error("AI returned invalid JSON structure");
        }
    }

    public static async generate(model: ModelID, prompt: string, fileContext: any): Promise<AIResponse> {
        const contextStr = JSON.stringify(fileContext);

        let response: AIResponse;

        switch (model) {
            case "heftcoder-pro":
            case "claude-4.5-sonnet":
                try {
                    response = await this.runLangdock(prompt, contextStr, CONFIG.LANGDOCK_ASSISTANT_ID, true);
                } catch (e: any) {
                    console.error("Vibe Engine (Claude) Failed:", e.message);
                    console.warn("Attempting Failover to HeftCoder Plus (Watermelon)...");
                    try {
                        response = await this.runWatermelon(prompt, contextStr, CONFIG.WATERMELON_PLUS_ID);
                        response.failover = true;
                    } catch (failoverError: any) {
                        console.error("Failover Engine (Watermelon) also failed:", failoverError.message);
                        throw new Error(`Both PRO and PLUS engines failed. Last error: ${failoverError.message}`);
                    }
                }
                break;

            case "heftcoder-plus":
                response = await this.runWatermelon(prompt, contextStr, CONFIG.WATERMELON_PLUS_ID);
                break;

            case "debugger-pro":
                response = await this.runLangdock(
                    prompt,
                    contextStr,
                    CONFIG.LANGDOCK_DEBUGGER_PRO_ID,
                    false,
                    "You are a Senior Systems Architect. Your sole focus is analyzing Sandpack runtime errors. When a build fails, analyze the console output, identify the breaking line in the file system JSON, and provide the exact code fix. Do not provide high-level advice; provide code."
                );
                break;

            case "general-assistant":
                response = await this.runLangdock(prompt, contextStr, CONFIG.LANGDOCK_ASSISTANT_ID);
                break;

            case "flux.2-pro":
                response = await this.runFlux(prompt);
                break;

            case "sora":
                response = await this.runSora(prompt);
                break;

            case "mistral-large":
                response = await this.runMaaS(model, prompt, contextStr);
                break;

            case "heft-orchestrator":
                // Deprecated Azure Model
                throw new Error("Azure OpenAI (Heft Orchestrator) has been deprecated in favor of HeftCoder PRO.");

            default:
                throw new Error(`Unsupported Model Selected: ${model}`);
        }

        // Apply mandatory JSON cleaning across all code models (except image/video gen)
        if (model !== "flux.2-pro" && model !== "sora") {
            try {
                // Verify it's parsable, then return the stringified version
                const parsed = this.parseSafeJSON(response.content);
                response.content = JSON.stringify(parsed);
            } catch (e: any) {
                throw new Error(`Output Validation Failed: ${e.message}`);
            }
        }

        return response;
    }
}
