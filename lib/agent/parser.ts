/**
 * HashCoder IDE - Action Parser
 *
 * Parses AI responses and extracts structured actions
 */

import { AgentAction, WriteFileAction, InstallAction, RunAction } from './actions';
import { AgentEvent } from '@/types/workspace';
import { v4 as uuidv4 } from 'uuid';

export class ActionParser {
    /**
     * Parse file structure JSON into write_file actions
     */
    static parseFileActions(filesJson: Record<string, string>): WriteFileAction[] {
        const actions: WriteFileAction[] = [];

        for (const [filePath, content] of Object.entries(filesJson)) {
            actions.push({
                type: 'write_file',
                id: uuidv4(),
                timestamp: Date.now(),
                path: filePath,
                content: content,
                mode: 'create'
            });
        }

        return actions;
    }

    /**
     * Detect if package.json was created and generate install action
     */
    static detectInstallAction(files: WriteFileAction[]): InstallAction | null {
        const packageJsonFile = files.find(f => f.path === 'package.json');

        if (packageJsonFile) {
            try {
                const pkgJson = JSON.parse(packageJsonFile.content);
                const dependencies = Object.keys(pkgJson.dependencies || {});
                const devDependencies = Object.keys(pkgJson.devDependencies || {});
                const allPackages = [...dependencies, ...devDependencies];

                if (allPackages.length > 0) {
                    return {
                        type: 'install',
                        id: uuidv4(),
                        timestamp: Date.now(),
                        packages: allPackages,
                        packageManager: 'npm'
                    };
                }
            } catch (e) {
                console.warn('[ActionParser] Failed to parse package.json:', e);
            }
        }

        return null;
    }

    /**
     * Detect Next.js app and generate run action
     */
    static detectRunAction(files: WriteFileAction[]): RunAction | null {
        const hasNextConfig = files.some(f => f.path.includes('next.config'));
        const hasPackageJson = files.some(f => f.path === 'package.json');

        if (hasNextConfig || hasPackageJson) {
            return {
                type: 'run',
                id: uuidv4(),
                timestamp: Date.now(),
                command: 'npm run dev'
            };
        }

        return null;
    }

    /**
     * Parse AI response into actions and events
     */
    static parseResponse(filesJson: Record<string, string>) {
        const writeActions = this.parseFileActions(filesJson);
        const installAction = this.detectInstallAction(writeActions);
        const runAction = this.detectRunAction(writeActions);

        const actions: AgentAction[] = [...writeActions];

        if (installAction) {
            actions.push(installAction);
        }

        if (runAction) {
            actions.push(runAction);
        }

        // Create events for UI display
        const events: AgentEvent[] = [];

        // Add file creation events
        writeActions.forEach(action => {
            events.push({
                type: "file:create",
                path: action.path
            });
        });

        // Add command events
        if (installAction) {
            events.push({
                type: "command",
                cmd: `npm install ${installAction.packages.join(' ')}`
            });
        }

        if (runAction) {
            events.push({
                type: "command",
                cmd: runAction.command
            });
        }

        return {
            conversationText: `Generated ${writeActions.length} files`,
            actions,
            events,
            requiresConfirmation: false
        };
    }

    /**
     * Parse chat response (no actions)
     */
    static parseChatResponse(content: string): { events: AgentEvent[] } {
        return {
            events: [{
                type: "chat",
                content
            }]
        };
    }
}
