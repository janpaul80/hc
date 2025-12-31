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
    LANGDOCK_ASSISTANT_ID: process.env.LANGDOCK_ASSISTANT_ID!
};

export type ModelID =
    | "heft-orchestrator"
    | "claude-4.5-sonnet"
    | "grok-4"
    | "deepseek-v3.1"
    | "mistral-medium"
    | "mistral-large"
    | "codestral"
    | "llama-4"
    | "kimi-k2"
    | "sora"
    | "flux.2-pro";

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

    private static async runLangdock(prompt: string, context: string): Promise<AIResponse> {
        try {
            const response = await fetch("https://api.langdock.com/assistant/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CONFIG.LANGDOCK_API_KEY}`
                },
                body: JSON.stringify({
                    assistantId: CONFIG.LANGDOCK_ASSISTANT_ID,
                    messages: [
                        { role: "system", content: "You are Claude 4.5 Sonnet, the brain of HeftCoder Pro. ENFORCE NO-PROSE: Return ONLY valid JSON representing file changes. No explanations, no conversation." },
                        { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                    ],
                    model: "claude-4.5-sonnet" // Ensuring the model is explicitly requested if assistant doesn't default
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Langdock API Error: ${errText}`);
            }

            const data = await response.json();
            return {
                content: data.choices[0].message.content || "{}",
                usage: data.usage
            };
        } catch (error: any) {
            throw new Error(`Langdock Integration Failed: ${error.message}`);
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
            case "claude-4.5-sonnet":
                try {
                    response = await this.runLangdock(prompt, contextStr);
                } catch (e: any) {
                    console.error("Vibe Engine (Claude) Failed, Failover to Mistral Large:", e.message);
                    response = await this.runMaaS("mistral-large", prompt, contextStr);
                    response.failover = true;
                }
                break;

            case "heft-orchestrator":
                response = await this.runGPT5(prompt, contextStr);
                break;

            case "flux.2-pro":
                response = await this.runFlux(prompt);
                break;

            case "sora":
                response = await this.runSora(prompt);
                break;

            case "grok-4":
            case "deepseek-v3.1":
            case "mistral-medium":
            case "mistral-large":
            case "codestral":
            case "llama-4":
            case "kimi-k2":
                response = await this.runMaaS(model, prompt, contextStr);
                break;

            default:
                throw new Error("Unsupported Model Selected");
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
