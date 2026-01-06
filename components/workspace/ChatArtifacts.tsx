"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Terminal, CheckCircle2, Circle, PlayCircle, FileText, Cpu, Layout, Play, Eye, EyeOff } from 'lucide-react';

/**
 * StageProgress Component
 * Shows the current phase of the AI Agent (Planning -> Approving -> Coding)
 */
export function StageProgress({ currentStage }: { currentStage: 'planning' | 'approving' | 'coding' }) {
    const stages = [
        { id: 'planning', label: 'Planning', icon: FileText },
        { id: 'approving', label: 'Approval', icon: CheckCircle2 },
        { id: 'coding', label: 'Coding', icon: Terminal },
    ];

    return (
        <div className="flex items-center justify-between px-6 py-3 bg-[#0f0f0f] border-b border-white/5 w-full">
            {stages.map((stage, idx) => {
                const isActive = stage.id === currentStage;
                const isCompleted = stages.findIndex(s => s.id === currentStage) > idx;
                const Icon = stage.icon;

                return (
                    <div key={stage.id} className="flex items-center gap-2">
                        <div className={`
                            flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors
                            ${isActive ? 'text-orange-500' : isCompleted ? 'text-green-500' : 'text-gray-600'}
                        `}>
                            <Icon className="w-3.5 h-3.5" />
                            {stage.label}
                        </div>
                        {idx < stages.length - 1 && (
                            <div className="w-8 h-[1px] bg-white/10 mx-2" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * TerminalArtifact Component
 * Renders ```bash code blocks as a terminal window
 */
export function TerminalArtifact({ content, title = "heft-coder@dev:~/project" }: { content: string, title?: string }) {
    // Clean content
    const cleanContent = content.replace(/^```(bash|sh|terminal)?/, '').replace(/```$/, '').trim();

    return (
        <div className="w-full my-4 rounded-lg overflow-hidden border border-gray-800 bg-[#0d0d0d] shadow-2xl font-mono text-xs">
            <div className="bg-[#1a1a1a] px-3 py-1.5 flex items-center gap-2 border-b border-gray-800">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="text-gray-600 ml-2">{title}</div>
            </div>
            <div className="p-4 text-green-400 overflow-x-auto">
                <div className="flex gap-2">
                    <span className="text-pink-500 select-none">➜</span>
                    <span className="text-blue-400 select-none">~</span>
                    <span className="whitespace-pre-wrap">{cleanContent}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * ArtifactMessage Component
 * The main rich-text renderer for the chat.
 */
export function ArtifactMessage({ content, onApprove }: { content: string, onApprove?: () => void }) {
    const [showThinking, setShowThinking] = useState(false);

    // Pre-processing to handle [WAIT] tag and [THINKING] blocks
    // Pre-processing to handle [WAIT], [EXEC] tags and [THINKING] blocks
    let processedContent = content;
    const hasWaitTag = processedContent.includes('[WAIT]');
    const hasExecTag = processedContent.includes('[EXEC]');

    processedContent = processedContent.replace('[WAIT]', '').replace('[EXEC]', '');

    // Extract thinking blocks if present (basic regex, robust parser would be better but this works for now)
    // We are trusting the AI to use markdown well, so we might just let standard markdown handle most things
    // except special tags.

    return (
        <div className="w-full space-y-4">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Stage Headers
                    h2: ({ node, ...props }) => (
                        <div className="mt-6 mb-3 flex items-center gap-2 pb-2 border-b border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wide" {...props} />
                        </div>
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-xs font-bold text-orange-400 mt-4 mb-2 uppercase" {...props} />
                    ),
                    // Formatting Lists
                    ul: ({ node, ...props }) => <ul className="space-y-1 my-2 pl-4 list-none" {...props} />,
                    li: ({ node, ...props }) => (
                        <li className="text-xs text-gray-400 pl-2 relative before:content-['•'] before:absolute before:left-[-10px] before:text-gray-600" {...props} />
                    ),
                    p: ({ node, children, ...props }) => {
                        // Check for [THINKING] tag in text
                        const text = String(children);
                        if (text.includes('[THINKING]')) {
                            return (
                                <div className="my-2">
                                    <button
                                        onClick={() => setShowThinking(!showThinking)}
                                        className="flex items-center gap-2 text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest transition-colors"
                                    >
                                        {showThinking ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        {showThinking ? 'Hide Reasoning' : 'Show Reasoning'}
                                    </button>
                                    {showThinking && (
                                        <div className="mt-2 p-3 bg-white/5 rounded-lg text-xs text-gray-500 italic border border-white/5">
                                            {text.replace('[THINKING]', '').trim()}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return <p className="text-xs text-gray-300 leading-relaxed mb-2" {...props}>{children}</p>;
                    },
                    // Code Blocks & Terminal
                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isTerminal = match && (match[1] === 'bash' || match[1] === 'sh' || match[1] === 'terminal');

                        if (!inline && isTerminal) {
                            return <TerminalArtifact content={String(children).replace(/\n$/, '')} />;
                        }

                        return !inline ? (
                            <div className="my-2 rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e]">
                                <div className="bg-[#252525] px-3 py-1 text-[10px] text-gray-500 font-mono border-b border-white/5">
                                    {match ? match[1] : 'code'}
                                </div>
                                <div className="p-3 overflow-x-auto">
                                    <code className="text-xs font-mono text-gray-300" {...props}>
                                        {children}
                                    </code>
                                </div>
                            </div>
                        ) : (
                            <code
                                className={`
                                    px-1.5 py-0.5 rounded text-[10px] font-mono font-medium
                                    ${String(children).startsWith('npm') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                        String(children).startsWith('cd') ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                            'bg-white/10 text-orange-200 border border-white/5'}
                                `}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {processedContent}
            </ReactMarkdown>

            {/* Resume / Approve Button */}
            {/* Resume / Approve Button */}
            {hasWaitTag && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onApprove}
                        className="group flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange-900/20 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Execute Plan
                    </button>
                </div>
            )}

            {hasExecTag && (
                <div className="mt-4 flex justify-end">
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                        <Cpu className="w-3.5 h-3.5" />
                        System Auto-Executing...
                    </div>
                </div>
            )}
        </div>
    );
}

// Re-export specific Artifacts for standalone use if needed
// Re-export specific Artifacts for standalone use if needed
export { PlanArtifactDummy as PlanArtifact }; // Correctly export the locally defined component

/** 
 * Backwards compatibility wrapper if PlanArtifact is still strictly imported
 * This simply wraps the content in the new Rich Renderer
 */
function PlanArtifactDummy({ content }: { content: string }) {
    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                <Layout className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Plan Artifact</span>
            </div>
            <ArtifactMessage content={content} />
        </div>
    )
} 
