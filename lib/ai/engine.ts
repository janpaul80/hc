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
console.log(`[AIEngine] LANGDOCK_API_KEY: ${process.env.LANGDOCK_API_KEY ? "PRESENT (READY)" : "MISSING (ACTION REQUIRED)"}`);
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
            throw new Error(`Langdock Configuration Missing: Ensure 'LANGDOCK_ASSISTANT_ID' and 'LANGDOCK_API_KEY' are correctly set in Coolify env.`);
        }

        // STEP 5 - Logging (No secrets)
        console.log(`[Langdock] Calling Agent: ${id}`);

        try {
            // STEP 2 - Langdock Agent Call (v1 endpoint, no model, agent key)
            const response = await fetch("https://api.langdock.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key}`
                },
                body: JSON.stringify({
                    agent: id,
                    messages: [
                        { role: "system", content: systemInstruction || "You are HeftCoder Pro, the most advanced AI orchestrator. ENFORCE NO-PROSE: Return ONLY valid JSON representing file changes. No explanations." },
                        { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                    ]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`Langdock API Error [Agent: ${id}]:`, errText);
                throw new Error(`Langdock API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content || "{}";

            // Handle reasoning tags if they appear in content (though Langdock agents usually clean this)
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

    private static async runMistral(prompt: string, context: string, agentId?: string): Promise<AIResponse> {
        const id = agentId || CONFIG.MISTRAL_AGENT_ID;
        const key = CONFIG.MISTRAL_API_KEY;

        if (!key) {
            throw new Error(`Mistral API Key Missing: Ensure 'MISTRAL_API_KEY' is set in Coolify env.`);
        }

        // STEP 5 - Logging
        console.log(`[Mistral] Calling Agent/Model: ${id}`);

        try {
            // STEP 3 - Mistral Call (Explicit agent_id or model)
            const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key}`
                },
                body: JSON.stringify({
                    agent_id: id || "mistral-medium-latest",
                    model: id ? undefined : "mistral-medium-latest",
                    messages: [
                        { role: "system", content: "You are HeftCoder Plus (Mistral). Return ONLY valid JSON representing file changes." },
                        { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Mistral API Error Details:", errText);
                throw new Error(`Mistral API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            return {
                content: data.choices[0].message.content || "{}",
                usage: data.usage ? {
                    inputTokenCount: data.usage.prompt_tokens,
                    outputTokenCount: data.usage.completion_tokens
                } : undefined,
                provider: "mistral",
                agent: "heftcoder-plus"
            };
        } catch (error: any) {
            console.error("Mistral Connectivity Error:", error.message);
            throw new Error(`Mistral Integration Failed: ${error.message}`);
        }
    }

    private static parseSafeJSON(str: string): any {
        try {
            // Remove markdown formatting if present
            let clean = str.replace(/```json/g, "").replace(/```/g, "").trim();
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
                const parsed = this.parseSafeJSON(response.content);
                response.content = JSON.stringify(parsed);
            } catch (e: any) {
                throw new Error(`Output Validation Failed: ${e.message}`);
            }
        }

        return response;
    }
}
