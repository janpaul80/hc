import { AzureOpenAI } from "openai";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const CONFIG = {
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT!,
    AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY!,
    AZURE_MAAS_ENDPOINT: process.env.AZURE_MAAS_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT!,
    AZURE_MAAS_KEY: process.env.AZURE_MAAS_KEY || process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY!,
};

export type ModelID =
    | "gpt-5.1"
    | "grok-4"
    | "deepseek-v3.1"
    | "mistral-medium"
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
            apiVersion: "2025-04-01-preview", // Updated to match .env.local version if possible
            deployment: "gpt-5.1-orchestrator",
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
            "grok-4": "grok-4-reasoning",
            "deepseek-v3.1": "deepseek-v3-1",
            "mistral-medium": "mistral-medium-latest"
        };

        const response = await client.path("/chat/completions").post({
            body: {
                model: deploymentMap[modelId],
                messages: [
                    { role: "system", content: "You are a coding assistant. Return valid JSON only. If you are a reasoning model, finish your internal thinking before outputting the final JSON." },
                    { role: "user", content: `Context: ${context} \n\n Task: ${prompt}` }
                ],
                temperature: modelId === "grok-4" ? 0.3 : 0.1,
                max_tokens: 4096
            }
        });

        if (response.status !== "200") {
            throw new Error(`MaaS Error: ${(response.body as any).error}`);
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
                model: "flux-2-pro",
                prompt: prompt,
                size: "1024x1024",
                n: 1
            }
        });

        if (response.status !== "200") throw new Error("Flux Gen Failed");

        return { content: JSON.stringify({ url: (response.body as any).data[0].url }) };
    }

    public static async generate(model: ModelID, prompt: string, fileContext: any): Promise<AIResponse> {
        const contextStr = JSON.stringify(fileContext);

        switch (model) {
            case "gpt-5.1":
                return this.runGPT5(prompt, contextStr);

            case "flux.2-pro":
                return this.runFlux(prompt);

            case "grok-4":
            case "deepseek-v3.1":
            case "mistral-medium":
                return this.runMaaS(model, prompt, contextStr);

            default:
                throw new Error("Unsupported Model Selected");
        }
    }
}
