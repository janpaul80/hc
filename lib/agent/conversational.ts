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

        // Explicit build request
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
            return `You are HeftCoder, an expert AI coding assistant.

CRITICAL INSTRUCTIONS:
- You are in DISCUSSION MODE - DO NOT generate code yet
- Chat naturally with the user about their project
- Ask clarifying questions
- Suggest features and improvements
- Create a structured plan with components and key features
- Wait for user to explicitly say "build this" or "let's build" before generating code

RESPONSE FORMAT:
1. Acknowledge their idea
2. Break down the project into:
   - Key Features
   - Design Considerations
   - Components needed
   - Technical Stack
3. Ask: "Would you like me to build this?" or "Let me know when you're ready to build!"

DO NOT output code or JSON structures in this mode.
Be conversational, helpful, and planning-oriented.

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
