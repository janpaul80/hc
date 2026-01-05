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
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || process.env.MISTRAL_MEDIUM_API_KEY!,
    MISTRAL_AGENT_ID: process.env.MISTRAL_AGENT_ID || "ag_019b7df2cec2719aa68ad67ae2bd6927"
};

// --- RUNTIME BOOT LOGGING ---
console.log("[AIEngine] Runtime Config Validation (Static Check):");
console.log(`[AIEngine] LANGDOCK_API_KEY: ${process.env.LANGDOCK_API_KEY ? `PRESENT (Sfx: ...${process.env.LANGDOCK_API_KEY.slice(-7)})` : "MISSING"}`);
console.log(`[AIEngine] LANGDOCK_ASSISTANT_ID: ${process.env.LANGDOCK_ASSISTANT_ID ? "PRESENT (READY)" : "MISSING (ACTION REQUIRED)"}`);
console.log(`[AIEngine] MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY || process.env.MISTRAL_MEDIUM_API_KEY ? "PRESENT (READY)" : "MISSING (ACTION REQUIRED)"}`);
console.log(`[AIEngine] MISTRAL_AGENT_ID: ${process.env.MISTRAL_AGENT_ID ? "PRESENT (CUSTOM)" : "NOT SET (USING DEFAULT: mistral-medium-latest)"}`);

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
    provider: "langdock" | "mistral" | "openai" | "azure";
    agent: string;
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
            provider: "azure",
            agent: "gpt-5.chat"
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
                provider: "azure",
                agent: modelId
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

            return {
                content: JSON.stringify({ url: response.data[0].url }),
                provider: "azure",
                agent: "flux"
            };
        } catch (error: any) {
            throw new Error(`Flux Gen Failed [${deploymentName}]: ${error.message}`);
        }
    }

    private static async runSora(prompt: string): Promise<AIResponse> {
        const deploymentName = process.env.AZURE_DEPLOYMENT_SORA || "sora";
        // Sora on AOAI typically uses a specific preview SDK or endpoint, 
        // but for now we follow the same deployment pattern.
        return {
            content: JSON.stringify({ url: "#", message: `Sora video generation (Mock: using deployment ${deploymentName})` }),
            provider: "azure",
            agent: "sora"
        };
    }

    private static async runLangdock(prompt: string, context: string, assistantId?: string, systemInstruction?: string): Promise<AIResponse> {
        const id = assistantId || CONFIG.LANGDOCK_ASSISTANT_ID;
        const key = CONFIG.LANGDOCK_API_KEY;

        if (!id || id === "HeftCoder Pro" || !key) {
            console.error(`[CRITICAL] Langdock Config Missing at Runtime! assistantId: ${id}, hasKey: ${!!key}`);
            throw new Error(`Langdock Configuration Missing: Ensure 'LANGDOCK_ASSISTANT_ID' and 'LANGDOCK_API_KEY' are correctly set in Coolify env.`);
        }

        // Mask the key for logging
        const maskedKey = `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
        console.log(`[Langdock] Calling Agent: ${id} with Key: ${maskedKey}`);

        try {
            const strictSystemPrompt = `You are HeftCoder PRO. Your soul mission is to generate code.
You MUST respond with VALID JSON ONLY.
No markdown.
No explanations.
No backticks.
If unsure, return {}.
The first character of your response must be '{' and the last character must be '}'.

Your output format MUST be:
{
  "path/to/file.ext": "complete file content",
  "another/file.tsx": "content"
}`;

            const payload = {
                assistantId: id,
                messages: [
                    { role: "user", content: `Generate code files for: ${prompt}\n\nExisting context:\n${context}` }
                ]
            };

            const response = await fetch("https://api.langdock.com/assistant/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`Langdock API Error [Agent: ${id}]: Status ${response.status}`, errText);
                throw new Error(`Langdock API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            console.log("[Langdock] FULL DEBUG RESPONSE:", JSON.stringify(data, null, 2));

            // Langdock Agent API returns: { "result": [{ "role": "assistant", "content": "..." }] }
            let content =
                data?.result?.[0]?.content ||           // Langdock Agent API format
                data?.choices?.[0]?.message?.content || // OpenAI format
                data?.message?.content ||               // Simple message format
                data?.content ||                        // Direct content
                data?.output ||                         // Output field
                JSON.stringify(data);                   // Last resort fallback

            console.log("[Langdock] Extracted content:", content);

            content = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();

            return {
                content,
                usage: data.usage,
                provider: "langdock",
                agent: "heftcoder-pro"
            };
        } catch (error: any) {
            console.error("Langdock Connectivity/Runtime Error:", error.message);
            throw new Error(`Langdock Integration Failed: ${error.message}`);
        }
    }

    private static async runMistral(prompt: string, context: string, modelOverride?: string): Promise<AIResponse> {
        // ALWAYS use model-based chat completions (not agents API)
        const model = modelOverride || "mistral-medium-latest";
        const key = CONFIG.MISTRAL_API_KEY;
        if (!key) {
            throw new Error(`Mistral API Key Missing: Ensure 'MISTRAL_API_KEY' is set in Coolify env.`);
        }

        let attempts = 0;
        const maxAttempts = 2;
        let lastError: any = null;
        let mistralUsage: AIResponse['usage'] | undefined;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`[Mistral] Call attempt ${attempts}/${maxAttempts}`);
                const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${key}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "mistral-medium-latest",
                        messages: [
                            {
                                role: "system",
                                content: `You are HeftCoder PLUS.
You MUST respond with VALID JSON ONLY.
No markdown.
No explanations.
No backticks.
If unsure, return {}.
The output MUST be a single JSON object where keys are file paths and values are file contents.`
                            },
                            { role: "user", content: `Generate code files for: ${prompt}\n\nExisting context:\n${context}` }
                        ],
                        temperature: 0.2, // Lower temperature for more consistent JSON
                        max_tokens: 4096
                    }),
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`Mistral API error: ${err}`);
                }

                const data = await response.json();
                const raw = data.choices?.[0]?.message?.content ?? "";
                mistralUsage = data.usage ? {
                    inputTokenCount: data.usage.prompt_tokens,
                    outputTokenCount: data.usage.completion_tokens
                } : undefined;

                try {
                    const parsedContent = this.parseSafeJSON(raw);
                    return {
                        content: JSON.stringify(parsedContent),
                        usage: mistralUsage,
                        provider: "mistral",
                        agent: "heftcoder-plus"
                    };
                } catch (err) {
                    console.warn(`[Mistral] Parse failed on attempt ${attempts}. Raw output snippet: ${raw.substring(0, 100)}...`);
                    lastError = err;
                    if (attempts >= maxAttempts) {
                        // Final fallback — do NOT 500, return raw content if parsing consistently fails
                        return {
                            content: raw, // Return raw string if parsing fails after retries
                            usage: mistralUsage,
                            provider: "mistral",
                            agent: "heftcoder-plus"
                        };
                    }
                }
            } catch (err) {
                console.error(`[Mistral] Network/API Error on attempt ${attempts}:`, err);
                lastError = err;
                if (attempts >= maxAttempts) throw err;
            }
        }
        throw lastError; // Should not be reached if maxAttempts > 0
    }

    private static parseSafeJSON(str: string): any {
        try {
            return JSON.parse(str);
        } catch {
            // Attempt repair
            try {
                let repaired = str.trim()
                    .replace(/```json|```/g, "")
                    .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1");

                // Extra cleaning for thinking blocks
                repaired = repaired.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();

                return JSON.parse(repaired);
            } catch (e) {
                console.error("[Parser Error] Aggressive cleanup failed. Total length:", str.length);
            }
        }

    /**
     * Unwrap nested content structure from Mistral
     * Converts: { "file.ts": { "content": "code" } }
     * To: { "file.ts": "code" }
     */
    private static unwrapContent(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const unwrapped: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && 'content' in value) {
                // Unwrap nested content
                unwrapped[key] = (value as any).content;
            } else {
                unwrapped[key] = value;
            }
        }
        return unwrapped;
    }

    public static async generate(model: ModelID, prompt: string, fileContext: any): Promise<AIResponse> {
        const contextStr = JSON.stringify(fileContext);
        let response: AIResponse;

        // STEP 1 - Strict Routing Logic
        switch (model) {
            case "heftcoder-pro":
            case "claude-4.5-sonnet":
                // STEP 5 - Hard Fallback (No silent switch)
                response = await this.runLangdock(prompt, contextStr, CONFIG.LANGDOCK_ASSISTANT_ID);
                break;

            case "heftcoder-plus":
                response = await this.runMistral(prompt, contextStr);
                break;

            case "debugger-pro":
                response = await this.runLangdock(
                    prompt,
                    contextStr,
                    CONFIG.LANGDOCK_DEBUGGER_PRO_ID,
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
                throw new Error("Azure OpenAI (Heft Orchestrator) has been deprecated in favor of HeftCoder PRO.");

            default:
                throw new Error(`Unsupported Model Selected: ${model}`);
        }

        // STEP 4 - Normalize the Response (Content Cleanup)
        if (model !== "flux.2-pro" && model !== "sora") {
            try {
                let parsed = this.parseSafeJSON(response.content);
                // Unwrap nested content structure (e.g., from Mistral)
                parsed = this.unwrapContent(parsed);
                response.content = JSON.stringify(parsed);
            } catch (e: any) {
                throw new Error(`Output Validation Failed: ${e.message}`);
            }
        }

        return response;
    }
}
