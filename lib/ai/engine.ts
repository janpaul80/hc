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
