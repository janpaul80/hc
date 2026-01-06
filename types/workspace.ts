/**
 * HashCoder IDE - Updated Message Interface with Actions
 */

import { AgentAction } from '@/lib/agent/actions';

export interface Message {
    role: "user" | "ai";
    content: string;
    imageUrl?: string;
    // NEW: Actions from the agent
    actions?: AgentAction[];
    actionStatuses?: Record<string, 'pending' | 'running' | 'done' | 'error'>;
    actionOutputs?: Record<string, string>;
    actionErrors?: Record<string, string>;
}
