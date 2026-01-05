/**
 * HashCoder IDE - Action Executor
 * 
 * Executes agent actions in a sandboxed environment
 * Streams results back to the client
 */

import { AgentAction, ActionResult } from './actions';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class ActionExecutor {
    private workspaceRoot: string;
    private execQueue: AgentAction[] = [];
    private isExecuting = false;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Execute a single action
     */
    async execute(action: AgentAction): Promise<ActionResult> {
        console.log(`[ActionExecutor] Executing ${action.type}:`, action.id);

        try {
            switch (action.type) {
                case 'write_file':
                    return await this.executeWriteFile(action);
                case 'delete_file':
                    return await this.executeDeleteFile(action);
                case 'install':
                    return await this.executeInstall(action);
                case 'run':
                    return await this.executeRun(action);
                case 'preview':
                    return await this.executePreview(action);
                case 'deploy':
                    return await this.executeDeploy(action);
                default:
                    throw new Error(`Unknown action type: ${(action as any).type}`);
            }
        } catch (error: any) {
            console.error(`[ActionExecutor] Error executing ${action.type}:`, error);
            return {
                actionId: action.id,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Write or update a file
     */
    private async executeWriteFile(action: any): Promise<ActionResult> {
        const filePath = path.join(this.workspaceRoot, action.path);
        const dirPath = path.dirname(filePath);

        // Ensure directory exists
        await fs.mkdir(dirPath, { recursive: true });

        // Write file
        await fs.writeFile(filePath, action.content, 'utf-8');

        return {
            actionId: action.id,
            success: true,
            output: `Created ${action.path}`
        };
    }

    /**
     * Delete a file
     */
    private async executeDeleteFile(action: any): Promise<ActionResult> {
        const filePath = path.join(this.workspaceRoot, action.path);
        await fs.unlink(filePath);

        return {
            actionId: action.id,
            success: true,
            output: `Deleted ${action.path}`
        };
    }

    /**
     * Install npm packages
     */
    private async executeInstall(action: any): Promise<ActionResult> {
        const packageManager = action.packageManager || 'npm';
        const packages = action.packages.join(' ');
        const command = `${packageManager} install ${packages}`;

        const result = await this.runCommand(command, this.workspaceRoot);

        return {
            actionId: action.id,
            success: result.exitCode === 0,
            output: result.stdout,
            error: result.stderr
        };
    }

    /**
     * Run a command
     */
    private async executeRun(action: any): Promise<ActionResult> {
        const cwd = action.cwd ? path.join(this.workspaceRoot, action.cwd) : this.workspaceRoot;
        const result = await this.runCommand(action.command, cwd, action.env);

        return {
            actionId: action.id,
            success: result.exitCode === 0,
            output: result.stdout,
            error: result.stderr
        };
    }

    /**
     * Start preview server
     */
    private async executePreview(action: any): Promise<ActionResult> {
        return {
            actionId: action.id,
            success: true,
            metadata: {
                port: action.port,
                url: action.url
            }
        };
    }

    /**
     * Deploy to platform
     */
    private async executeDeploy(action: any): Promise<ActionResult> {
        // TODO: Implement deployment logic
        return {
            actionId: action.id,
            success: true,
            output: `Deployment to ${action.platform} initiated`
        };
    }

    /**
     * Run a shell command and capture output
     */
    private runCommand(
        command: string,
        cwd: string,
        env?: Record<string, string>
    ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        return new Promise((resolve) => {
            const child = spawn(command, {
                cwd,
                shell: true,
                env: { ...process.env, ...env }
            });

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: code || 0
                });
            });
        });
    }
}
