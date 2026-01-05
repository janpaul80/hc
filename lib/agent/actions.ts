/**
 * HashCoder IDE - Agent Action System
 * 
 * This defines the structured actions that AI agents can emit.
 * Actions are executed server-side and results are streamed to the client.
 */

export type AgentActionType =
    | 'write_file'
    | 'delete_file'
    | 'install'
    | 'run'
    | 'preview'
    | 'deploy';

export interface BaseAction {
    type: AgentActionType;
    id: string;
    timestamp: number;
}

export interface WriteFileAction extends BaseAction {
    type: 'write_file';
    path: string;
    content: string;
    mode?: 'create' | 'update' | 'overwrite';
}

export interface DeleteFileAction extends BaseAction {
    type: 'delete_file';
    path: string;
}

export interface InstallAction extends BaseAction {
    type: 'install';
    packages: string[];
    packageManager?: 'npm' | 'yarn' | 'pnpm';
}

export interface RunAction extends BaseAction {
    type: 'run';
    command: string;
    cwd?: string;
    env?: Record<string, string>;
}

export interface PreviewAction extends BaseAction {
    type: 'preview';
    port: number;
    url: string;
}

export interface DeployAction extends BaseAction {
    type: 'deploy';
    platform: 'vercel' | 'github';
    config?: Record<string, any>;
}

export type AgentAction =
    | WriteFileAction
    | DeleteFileAction
    | InstallAction
    | RunAction
    | PreviewAction
    | DeployAction;

/**
 * Action execution result
 */
export interface ActionResult {
    actionId: string;
    success: boolean;
    output?: string;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * Agent response with mixed content and actions
 */
export interface AgentResponse {
    conversationText?: string;  // Human-readable explanation
    actions: AgentAction[];     // Structured actions to execute
    requiresConfirmation?: boolean;
}
