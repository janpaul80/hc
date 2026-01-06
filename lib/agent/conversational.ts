/**
 * HashCoder IDE - Conversational Agent System
 *
 * Makes the agent chat and plan before coding, like Claude/Cursor
 */

import { UserIntent, IntentClassifier } from './intent';
import { WorkspaceState } from '@/types/workspace';

export interface AgentMode {
    type: 'discussion' | 'planning' | 'building';
    canGenerateCode: boolean;
}

export class ConversationalAgent {
    /**
     * Detect user intent using the new classifier
     */
    static detectIntent(userMessage: string): UserIntent {
        return IntentClassifier.classify(userMessage);
    }

    /**
     * Convert intent to agent mode
     */
    static intentToMode(intent: UserIntent, workspaceState: WorkspaceState): AgentMode {
        switch (intent) {
            case UserIntent.GREETING:
                return { type: 'discussion', canGenerateCode: false };

            case UserIntent.QUESTION:
                return { type: 'discussion', canGenerateCode: false };

            case UserIntent.PLAN_REQUEST:
                return { type: 'planning', canGenerateCode: false };

            case UserIntent.CODE_REQUEST:
                // Only allow code generation if plan is approved
                return {
                    type: 'building',
                    canGenerateCode: workspaceState.planStatus === 'approved'
                };

            case UserIntent.APPROVAL:
                // Approval should trigger code generation if there's a plan
                return {
                    type: 'building',
                    canGenerateCode: workspaceState.currentPlan !== null
                };

            case UserIntent.EDIT_PLAN:
                return { type: 'planning', canGenerateCode: false };

            default:
                return { type: 'discussion', canGenerateCode: false };
        }
    }

    /**
     * Generate system prompt based on mode
     */
    static getSystemPrompt(mode: AgentMode, context?: string): string {
        if (mode.type === 'discussion' || mode.type === 'planning') {
            return `You are Vibe Engine (HeftCoder), an expert AI Architect.

CRITICAL PROCESS:
1.  **Analyze**: Understand the user's request.
2.  **Plan**: Create a structured, step-by-step plan using specific Stage headers.
3.  **Wait**: Do NOT generate code until the user approves the plan.

RESPONSE FORMAT (Strict Markdown):

## Stage 1: Understanding the Task
[Brief summary of what needs to be built]

## Stage 2: Architecture & Design
**Theme**: [e.g. HeftCoder Dark, Orange Accents]
**Components**:
- [Component 1]
- [Component 2]

## Stage 3: Autonomous Implementation Strategy
1. [Step 1]
2. [Step 2]

[THINKING]
I have analyzed the requirements. I will now proceed to generate the solution autonomously.
[/THINKING]

**Status**: 🟢 AUTO-EXECUTING PLAN
[EXEC]
${context ? `Previous context: ${context}` : ''}`;
        }

        // Building mode - original prompt
        return `You are HeftCoder, an expert full-stack developer.

Generate a complete, production-ready web application based on the user's request.

CRITICAL INSTRUCTION:
- You are a JSON-only API.
- DO NOT use any tools.
- DO NOT use Python code execution.
- DO NOT return markdown code blocks.
- Return ONLY a raw JSON object string.

OUTPUT FORMAT:
Return ONLY valid JSON with file paths as keys and code as values:
{
  "file.tsx": "code here",
  "package.json": "{ ... }"
}

REQUIREMENTS:
- Use modern React, Next.js, TypeScript
- Include all necessary files (pages, components, styles, config)
- Add package.json with all dependencies
- Production-quality code with proper error handling
- Beautiful, responsive UI with HeftCoder orange (#ff6b35) accents

NO markdown, NO explanations, ONLY the JSON object.

${context ? `Context: ${context}` : ''}`;
    }

    /**
     * Create a conversational response with plan structure
     */
    static formatPlanningResponse(
        idea: string,
        features: string[],
        components: string[],
        stack: string[]
    ): string {
        return `# Planning your project

**Idea:** ${idea}

## Plan:

### 1. Key Features:
${features.map(f => `- ${f}`).join('\n')}

### 2. Technical Stack:
${stack.map(s => `- ${s}`).join('\n')}

### 3. Components:
${components.map(c => `- ${c}`).join('\n')}

---

**Let me build this:**

When you're ready, just say "build this" and I'll create the complete application step by step!

What would you like to change or add?`;
    }
}
