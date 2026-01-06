"use client";

import { useEffect, useState, useRef } from 'react';
import { Terminal as TerminalIcon, Copy, Check } from 'lucide-react';

interface TerminalLine {
    type: 'stdout' | 'stderr' | 'info';
    text: string;
    timestamp: number;
}

interface StreamingTerminalProps {
    actionId: string;
    command: string;
    onComplete?: (exitCode: number) => void;
}

export function StreamingTerminal({ actionId, command, onComplete }: StreamingTerminalProps) {
    const [lines, setLines] = useState<TerminalLine[]>([
        { type: 'info', text: `$ ${command}`, timestamp: Date.now() }
    ]);
    const [isRunning, setIsRunning] = useState(true);
    const [exitCode, setExitCode] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [lines]);

    // Simulate streaming (in real implementation, this would be WebSocket)
    useEffect(() => {
        // This is a placeholder - in production this would connect to WebSocket
        // and receive real streaming output

        // For now, just mark as complete after a delay
        const timer = setTimeout(() => {
            setLines(prev => [...prev, {
                type: 'stdout',
                text: 'Command executed successfully',
                timestamp: Date.now()
            }]);
            setIsRunning(false);
            setExitCode(0);
            onComplete?.(0);
        }, 1000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    const copyOutput = () => {
        const output = lines.map(l => l.text).join('\n');
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-black rounded-lg border border-gray-800 overflow-hidden font-mono text-xs">
            {/* Terminal Header */}
            <div className="bg-[#1a1a1a] border-b border-gray-800 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">Terminal</span>
                    {isRunning && (
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-500 text-[10px]">Running</span>
                        </div>
                    )}
                    {!isRunning && exitCode !== null && (
                        <span className={`text-[10px] ${exitCode === 0 ? 'text-green-500' : 'text-red-500'}`}>
                            Exit code: {exitCode}
                        </span>
                    )}
                </div>

                <button
                    onClick={copyOutput}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Copy output"
                >
                    {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                    ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                    )}
                </button>
            </div>

            {/* Terminal Output */}
            <div
                ref={terminalRef}
                className="p-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
                {lines.map((line, i) => (
                    <div key={i} className="leading-relaxed">
                        <span className={
                            line.type === 'stderr' ? 'text-red-400' :
                                line.type === 'info' ? 'text-blue-400' :
                                    'text-green-400'
                        }>
                            {line.text}
                        </span>
                    </div>
                ))}

                {/* Cursor blink while running */}
                {isRunning && (
                    <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1" />
                )}
            </div>
        </div>
    );
}

/**
 * Compact terminal block for action lists
 */
interface TerminalBlockProps {
    command: string;
    output?: string;
    error?: string;
    exitCode?: number;
    isRunning?: boolean;
}

export function TerminalBlock({ command, output, error, exitCode, isRunning }: TerminalBlockProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    const copyOutput = () => {
        const text = error || output || command;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-black rounded-lg border border-gray-800 overflow-hidden font-mono text-xs">
            {/* Header */}
            <div
                className="bg-[#1a1a1a] border-b border-gray-800 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-[#222]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 truncate">$ {command}</span>
                    {isRunning && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        copyOutput();
                    }}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                    {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                    ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                    )}
                </button>
            </div>

            {/* Output */}
            {isExpanded && (output || error) && (
                <div className="p-3 max-h-48 overflow-y-auto">
                    <pre className={`whitespace-pre-wrap ${error ? 'text-red-400' : 'text-green-400'}`}>
                        {error || output}
                    </pre>
                    {exitCode !== undefined && (
                        <div className={`mt-2 text-[10px] ${exitCode === 0 ? 'text-green-500' : 'text-red-500'}`}>
                            Exit code: {exitCode}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
