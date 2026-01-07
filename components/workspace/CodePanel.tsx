"use client";

import React from 'react';
import { X, FileCode } from 'lucide-react';

interface CodePanelProps {
    fileName: string;
    code: string;
    onClose?: () => void;
}

function highlightCode(code: string) {
    if (!code) return null;
    const lines = code.split('\n');
    return lines.map((line, idx) => {
        let highlighted = line
            .replace(/(import|from|export|default|function|return|const|let|var)/g, '<span class="text-purple-400">$1</span>')
            .replace(/('.*?'|".*?")/g, '<span class="text-green-400">$1</span>')
            .replace(/(\{|\}|\(|\)|\[|\])/g, '<span class="text-yellow-300">$1</span>')
            .replace(/(className)/g, '<span class="text-cyan-400">$1</span>')
            .replace(/(&lt;\/?\w+)/g, '<span class="text-blue-400">$1</span>')
            .replace(/(React|App)/g, '<span class="text-amber-300">$1</span>');

        return (
            <div key={idx} className="flex min-w-full">
                <span className="w-12 text-right pr-4 text-zinc-700 select-none text-[10px] bg-[#050505] sticky left-0 font-mono">
                    {idx + 1}
                </span>
                <span
                    className="flex-1 text-zinc-300 font-mono text-xs pl-2"
                    dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }}
                />
            </div>
        );
    });
}

export default function CodePanel({ fileName = 'App.tsx', code = '', onClose }: CodePanelProps) {
    return (
        <div className="h-full flex flex-col bg-[#0d0d0d] rounded-lg overflow-hidden border border-[#1f1f1f] shadow-2xl">
            {/* Tab Bar */}
            <div className="flex items-center bg-[#070707] border-b border-[#1a1a1a]">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] border-r border-[#1a1a1a] border-t-2 border-t-orange-500/50 relative">
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-semibold text-zinc-200">{fileName}</span>
                    <button
                        onClick={onClose}
                        className="ml-2 p-0.5 rounded hover:bg-[#2a2a2a] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-0 bg-[#080808]">
                <div className="font-mono text-xs leading-6 py-4 min-w-fit">
                    {highlightCode(code)}
                </div>
            </div>
        </div>
    );
}
