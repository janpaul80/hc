"use client";

import { AgentAction, InstallAction, RunAction, WriteFileAction } from '@/lib/agent/actions';
import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, FileText, Package, Terminal, Copy } from 'lucide-react';

interface ActionBlockProps {
    action: AgentAction;
    status: 'pending' | 'running' | 'done' | 'error';
    output?: string;
    error?: string;
}

export function ActionBlock({ action, status, output, error }: ActionBlockProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const getIcon = () => {
        if (status === 'running') return <Loader2 className="w-4 h-4 animate-spin text-orange-500" />;
        if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (status === 'error') return <Circle className="w-4 h-4 text-red-500" />;
        return <Circle className="w-4 h-4 text-gray-500" />;
    };

    const getActionTitle = () => {
        switch (action.type) {
            case 'write_file':
                return `Create ${(action as WriteFileAction).path}`;
            case 'install':
                return `Installing ${(action as InstallAction).packages.length} packages`;
            case 'run':
                return `Running: ${(action as RunAction).command}`;
            default:
                return action.type;
        }
    };

    const getActionIcon = () => {
        switch (action.type) {
            case 'write_file': return <FileText className="w-4 h-4" />;
            case 'install': return <Package className="w-4 h-4" />;
            case 'run': return <Terminal className="w-4 h-4" />;
            default: return null;
        }
    };

    const copyOutput = () => {
        if (output) {
            navigator.clipboard.writeText(output);
        }
    };

    return (
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden mb-3">
            {/* Action Header */}
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#222]"
                onClick={() => output && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {getIcon()}
                    <div className="flex items-center gap-2 text-white">
                        {getActionIcon()}
                        <span className="text-sm font-mono">{getActionTitle()}</span>
                    </div>
                </div>

                {output && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            copyOutput();
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                    >
                        <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Terminal Output */}
            {output && isExpanded && (
                <div className="border-t border-gray-800 bg-black p-4">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                        {output}
                    </pre>
                </div>
            )}

            {/* Error Output */}
            {error && (
                <div className="border-t border-red-900 bg-red-950/20 p-4">
                    <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                        {error}
                    </pre>
                </div>
            )}
        </div>
    );
}

interface ActionListProps {
    actions: AgentAction[];
    statuses: Record<string, 'pending' | 'running' | 'done' | 'error'>;
    outputs: Record<string, string>;
    errors: Record<string, string>;
}

export function ActionList({ actions, statuses, outputs, errors }: ActionListProps) {
    return (
        <div className="space-y-2">
            {actions.map((action) => (
                <ActionBlock
                    key={action.id}
                    action={action}
                    status={statuses[action.id] || 'pending'}
                    output={outputs[action.id]}
                    error={errors[action.id]}
                />
            ))}
        </div>
    );
}
