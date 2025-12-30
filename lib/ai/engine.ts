import { AzureOpenAI } from "openai";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const CONFIG = {
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, "")!,
    AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY!,
    AZURE_MAAS_ENDPOINT: (process.env.AZURE_MAAS_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT)?.replace(/\/+$/, "")!,
    AZURE_MAAS_KEY: process.env.AZURE_MAAS_KEY || process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY!,
    AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
};

export type ModelID =
    | "heft-orchestrator"
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
}

export class AIEngine {

    private static async runGPT5(prompt: string, context: string): Promise<AIResponse> {
        const client = new AzureOpenAI({
            endpoint: CONFIG.AZURE_OPENAI_ENDPOINT,
            apiKey: CONFIG.AZURE_OPENAI_KEY,
            apiVersion: CONFIG.AZURE_OPENAI_API_VERSION,
            deployment: process.env.AZURE_DEPLOYMENT_HEFTCODER_ORCHESTRATOR || process.env.AZURE_DEPLOYMENT_GPT51 || "heftcoder-orchestrator",
        });

        const response = await client.chat.completions.create({
            model: "gpt-5.1",
            messages: [
                { role: "system", content: "You are HeftCoder, an expert full-stack builder. Return ONLY valid JSON representing file changes." },
                { role: "system", content: `Context: ${context}` },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
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
        const client = ModelClient(
            CONFIG.AZURE_MAAS_ENDPOINT,
            new AzureKeyCredential(CONFIG.AZURE_MAAS_KEY)
        );

        const deploymentMap: Record<string, string> = {
            "grok-4": process.env.AZURE_DEPLOYMENT_GROK || "grok-4-fast-reasoning",
            "deepseek-v3.1": process.env.AZURE_DEPLOYMENT_DEEPSEEK || "DeepSeek-V3.2",
            "mistral-medium": process.env.AZURE_DEPLOYMENT_MISTRAL_MEDIUM || "mistral-medium-2505",
            "mistral-large": process.env.AZURE_DEPLOYMENT_MISTRAL_LARGE || "Mistral-Large-3",
            "codestral": process.env.AZURE_DEPLOYMENT_CODESTRAL || process.env.AZURE_DEPLOYMENT_MISTRAL || "Codestral-2501",
            "llama-4": process.env.AZURE_DEPLOYMENT_LLAMA_MAVERICK || process.env.AZURE_DEPLOYMENT_LLAMA || "Llama-4-Maverick-17B-128E-Instruct-FP8",
            "kimi-k2": process.env.AZURE_DEPLOYMENT_KIMI || process.env.AZURE_DEPLOYMENT_GPT51 || "Kimi-K2-Thinking"
        };

        const response = await client.path("/chat/completions").post({
            body: {
                model: deploymentMap[modelId],
                messages: [
                    { role: "system", content: "You are a coding assistant. Return valid JSON only. If you are a reasoning model, finish your internal thinking before outputting the final JSON." },
                    { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                ],
                temperature: (modelId === "grok-4" || modelId === "llama-4" || modelId === "kimi-k2") ? 0.3 : 0.1,
                max_tokens: 4096
            }
        });

        if (response.status !== "200") {
            const errorBody = response.body as any;
            const errorMessage = typeof errorBody === 'object'
                ? (errorBody?.error?.message || errorBody?.error || JSON.stringify(errorBody))
                : errorBody;
            throw new Error(`MaaS Error: ${errorMessage}`);
        }

        let raw = (response.body as any).choices[0].message.content;
        // Reasoning models cleanup
        raw = raw.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();
        raw = raw.replace(/```json/g, "").replace(/```/g, "");

        return {
            content: raw,
            usage: (response.body as any).usage
        };
    }

    private static async runFlux(prompt: string): Promise<AIResponse> {
        const client = ModelClient(
            CONFIG.AZURE_MAAS_ENDPOINT,
            new AzureKeyCredential(CONFIG.AZURE_MAAS_KEY)
        );

        const response = await client.path("/images/generations" as any).post({
            body: {
                model: process.env.AZURE_DEPLOYMENT_FLUX || "FLUX.2-pro",
                prompt: prompt,
                size: "1024x1024",
                n: 1
            } as any
        });

        if (response.status !== "200") throw new Error("Flux Gen Failed");

        return { content: JSON.stringify({ url: (response.body as any).data[0].url }) };
    }

    private static async runSora(prompt: string): Promise<AIResponse> {
        const client = new AzureOpenAI({
            endpoint: CONFIG.AZURE_OPENAI_ENDPOINT,
            apiKey: CONFIG.AZURE_OPENAI_KEY,
            apiVersion: CONFIG.AZURE_OPENAI_API_VERSION,
            deployment: process.env.AZURE_DEPLOYMENT_SORA || "sora",
        });

        return { content: JSON.stringify({ url: "#", message: "Sora video generation (Mock: waiting for Azure endpoint)" }) };
    }

    public static async generate(model: ModelID, prompt: string, fileContext: any): Promise<AIResponse> {
        const contextStr = JSON.stringify(fileContext);

        switch (model) {
            case "heft-orchestrator":
                return this.runGPT5(prompt, contextStr);

            case "flux.2-pro":
                return this.runFlux(prompt);

            case "sora":
                return this.runSora(prompt);

            case "grok-4":
            case "deepseek-v3.1":
            case "mistral-medium":
            case "mistral-large":
            case "codestral":
            case "llama-4":
            case "kimi-k2":
                return this.runMaaS(model, prompt, contextStr);

            default:
                throw new Error("Unsupported Model Selected");
        }
    }
}
