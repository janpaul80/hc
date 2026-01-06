"use client";

import { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
    visible: boolean;
    action?: 'thinking' | 'writing' | 'building';
}

export function ThinkingIndicator({ visible, action = 'thinking' }: ThinkingIndicatorProps) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        if (visible) {
            const interval = setInterval(() => {
                setDots(prev => prev.length >= 3 ? '' : prev + '.');
            }, 500);
            return () => clearInterval(interval);
        }
    }, [visible]);

    if (!visible) return null;

    const getIcon = () => {
        switch (action) {
            case 'writing':
                return (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'building':
                return (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M14.5 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7.5L14.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            default:
                return (
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                );
        }
    };

    const getTerminalView = () => {
        return (
            <div className="flex flex-col gap-1 w-full min-w-[250px]">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono border-b border-gray-700/50 pb-1 mb-1">
                    <span className="text-green-500">➜</span>
                    <span>~/project</span>
                </div>
                <div className="font-mono text-xs text-gray-400 space-y-1">
                    <div className="flex gap-2">
                        <span className="text-blue-400">info</span>
                        <span>installing dependencies...</span>
                    </div>
                    <div className="flex gap-2 text-gray-500">
                        <span>warn</span>
                        <span>react-dom@18.2.0 requires react@^18.2.0</span>
                    </div>
                    <div className="flex gap-2 text-green-400">
                        <span>success</span>
                        <span>added 142 packages in 1s</span>
                    </div>
                    <div className="flex gap-2 animate-pulse">
                        <span className="text-orange-500">wait</span>
                        <span>compiling modules...</span>
                    </div>
                </div>
            </div>
        );
    };

    const getText = () => {
        switch (action) {
            case 'writing':
                return `Writing code${dots}`;
            case 'building':
                return `Building environment${dots}`;
            default:
                return `thinking${dots}`;
        }
    };

    if (action === 'building') {
        return (
            <div className="rounded-lg bg-[#1e1e1e] border border-gray-700 p-3 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="text-xs text-gray-500 ml-2 font-mono">bash — 80x24</span>
                </div>
                {getTerminalView()}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-gray-400">
                {getIcon()}
            </div>
            <span className="text-sm text-gray-400 font-medium">
                {getText()}
            </span>
        </div>
    );
}

/**
 * Compact version for inline use
 */
export function ThinkingDots() {
    return (
        <div className="flex items-center gap-1 px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-xs text-gray-500 ml-1">thinking</span>
        </div>
    );
}
