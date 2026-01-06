/**
 * HashCoder IDE - Conversational Agent System
 * 
 * Makes the agent chat and plan before coding, like Claude/Cursor
 */

export interface AgentMode {
    type: 'discussion' | 'planning' | 'building';
    canGenerateCode: boolean;
}

export class ConversationalAgent {
    /**
     * Detect if user wants to chat vs build
     */
    static detectIntent(userMessage: string): AgentMode {
        const lowerMsg = userMessage.toLowerCase().trim();

        // Keywords that indicate user wants to BUILD NOW
        const buildTriggers = [
            'build this',
            'create this',
            'make this',
            'code this',
            'generate',
            'let\'s build',
            'start building',
            'implement',
            'write the code'
        ];

        // Keywords that indicate PLANNING/DISCUSSION
        const discussionTriggers = [
            'how would',
            'what do you think',
            'can you help',
            'i want to',
            'i need',
            'planning',
            'idea',
            'suggest',
            'should i',
            'what if'
        ];

        // Check for explicit build command
        const wantsToBuild = buildTriggers.some(trigger => lowerMsg.includes(trigger));

        // Check for discussion indicators
        const wantsToDiscuss = discussionTriggers.some(trigger => lowerMsg.includes(trigger));

        // If message is very short, probably wants to chat
        if (lowerMsg.length < 30 && !wantsToBuild) {
            return { type: 'discussion', canGenerateCode: false };
        }

        // Explicit build confirmation triggers - strict
        const immediateExecutionTriggers = [
            'execute plan',
            'run code',
            'start coding',
            'build it',
            'yes build this',
            'proceed',
            'approved'
        ];

        const wantsToExecute = immediateExecutionTriggers.some(trigger => lowerMsg.includes(trigger));

        // If it's a "build me a [complex thing]" request, it should actually be PLANNING first.
        // We only switch to building if they are confirming a plan or being very terse.
        if (wantsToExecute) {
            return { type: 'building', canGenerateCode: true };
        }

        // Even if they say "build", if it's a long description, it's a plan request.
        if (wantsToBuild && lowerMsg.length > 50) {
            return { type: 'planning', canGenerateCode: false };
        }

        // Fallback for short build commands
        if (wantsToBuild) {
            return { type: 'building', canGenerateCode: true };
        }

        // Wants to discuss/plan
        if (wantsToDiscuss) {
            return { type: 'planning', canGenerateCode: false };
        }

        // Default: If detailed description, assume planning
        if (lowerMsg.length > 100 && !wantsToBuild) {
            return { type: 'planning', canGenerateCode: false };
        }

        // Otherwise, discussion mode
        return { type: 'discussion', canGenerateCode: false };
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

## Stage 3: Implementation Steps
1. [Step 1]
2. [Step 2]

[THINKING]
I have outlined the plan above. I am waiting for user approval.
[/THINKING]

**Status**: 🟡 WAITING FOR APPROVAL
[WAIT]

${context ? `Previous context: ${context}` : ''}`;
        }

        // Building mode - original prompt
        return `You are HeftCoder, an expert full-stack developer.

Generate a complete, production-ready web application based on the user's request.

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
