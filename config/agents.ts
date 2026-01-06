/**
 * Multi-Agent Configuration
 *
 * Defines specialized agents for different tasks
 */

export interface AgentConfig {
    id: string;
    name: string;
    role: 'orchestrator' | 'architect' | 'coder' | 'devops' | 'docs';
    description: string;
    langdockId?: string; // Optional: If the agent is powered by a specific Langdock agent
    systemPrompt?: string; // Internal prompt if no Langdock ID
    capabilities: string[];
}

export const AGENTS: Record<string, AgentConfig> = {
    orchestrator: {
        id: 'orchestrator',
        name: 'Orchestrator',
        role: 'orchestrator',
        description: 'The main conversational agent for planning and general coding.',
        langdockId: 'bddc9537-f05f-47ce-ada1-c4573e2b9609',
        capabilities: ['planning', 'conversation', 'project-management']
    },

    architect: {
        id: 'architect',
        name: 'Architect',
        role: 'architect',
        description: 'Specialized agent for robust API and Database design.',
        langdockId: 'bddc9537-f05f-47ce-ada1-c4573e2b9609',
        capabilities: ['api-design', 'database-design', 'system-architecture']
    },

    coder: {
        id: 'coder',
        name: 'Coder',
        role: 'coder',
        description: 'Expert in building beautiful, responsive, and animated user interfaces.',
        langdockId: 'bddc9537-f05f-47ce-ada1-c4573e2b9609',
        capabilities: ['frontend', 'ui-ux', 'animation', 'responsive-design']
    },

    devops: {
        id: 'devops',
        name: 'DevOps',
        role: 'devops',
        description: 'Handles deployment, CI/CD, and infrastructure.',
        capabilities: ['deployment', 'ci-cd', 'docker', 'cloud']
    },

    docs: {
        id: 'docs',
        name: 'Documentation',
        role: 'docs',
        description: 'Creates comprehensive documentation and guides.',
        capabilities: ['documentation', 'tutorials', 'api-docs']
    }
};

/**
 * Get agent by ID
 */
export function getAgentById(id: string): AgentConfig | null {
    return AGENTS[id] || null;
}

/**
 * Get agents by role
 */
export function getAgentsByRole(role: AgentConfig['role']): AgentConfig[] {
    return Object.values(AGENTS).filter(agent => agent.role === role);
}

/**
 * Determine best agent for a task
 */
export function getBestAgentForTask(task: string): AgentConfig {
    const lowerTask = task.toLowerCase();

    // Route to specific agents based on keywords
    if (lowerTask.includes('deploy') || lowerTask.includes('ci/cd') || lowerTask.includes('docker')) {
        return AGENTS.devops;
    }

    if (lowerTask.includes('api') || lowerTask.includes('database') || lowerTask.includes('backend')) {
        return AGENTS.architect;
    }

    if (lowerTask.includes('ui') || lowerTask.includes('frontend') || lowerTask.includes('design')) {
        return AGENTS.coder;
    }

    if (lowerTask.includes('document') || lowerTask.includes('readme') || lowerTask.includes('guide')) {
        return AGENTS.docs;
    }

    // Default to orchestrator
    return AGENTS.orchestrator;
}
