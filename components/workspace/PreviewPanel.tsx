"use client";

import React, { useState, useEffect } from 'react';
import { Share2, Zap, AlertCircle } from 'lucide-react';
import { SandpackPreview } from "@codesandbox/sandpack-react";

interface PreviewPanelProps {
    isBuilding: boolean;
    isReady: boolean;
    port?: number;
    error?: string;
    buildStatus?: string;
}

export default function PreviewPanel({ isBuilding, isReady, port, error, buildStatus }: PreviewPanelProps) {
    const [dots, setDots] = useState('');

    // Animated dots for loading state
    useEffect(() => {
        if (isBuilding) {
            const interval = setInterval(() => {
                setDots(prev => prev.length >= 3 ? '' : prev + '.');
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isBuilding]);

    // Error State
    if (error) {
        return (
            <div className="h-full flex flex-col bg-[#0d0d0d] rounded-lg overflow-hidden border border-[#1f1f1f]">
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="bg-red-950/20 border border-red-900 rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            <h3 className="text-white font-medium">Build Failed</h3>
                        </div>
                        <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap max-h-48 overflow-auto">
                            {error}
                        </pre>
                    </div>
                </div>
            </div>
        );
    }

    // Ready State: Show preview
    if (isReady && port) {
        return (
            <div className="h-full flex flex-col bg-[#0d0d0d] rounded-lg overflow-hidden border border-[#1f1f1f]">
                {/* Browser Header Overlay */}
                <div className="h-10 bg-[#0a0a0a] flex items-center px-4 gap-2 border-b border-[#1a1a1a]">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex-1 bg-[#141414] mx-4 rounded-md text-[10px] text-center py-1 text-zinc-500 font-mono border border-[#2a2a2a] shadow-sm overflow-hidden truncate">
                        vibe-preview.heftcoder.app
                    </div>
                    <button className="p-1 hover:bg-[#2a2a2a] rounded text-zinc-500">
                        <Share2 className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="flex-1 preview-container relative bg-white">
                    <SandpackPreview
                        showNavigator={false}
                        showOpenInCodeSandbox={false}
                        showRefreshButton={false}
                        className="h-full w-full"
                    />
                </div>
            </div>
        );
    }

    // Fallback / Building State
    return (
        <div className="h-full flex flex-col bg-[#0d0d0d] rounded-lg overflow-hidden border border-[#1f1f1f]">
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className={`w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 ${isBuilding ? 'animate-pulse' : ''}`}>
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3L6 13h5l-2 8 7-10h-5l4-8z" />
                    </svg>
                </div>

                <h2 className="text-xl font-semibold text-zinc-200 mb-2">
                    {isBuilding ? `Building your idea${dots}` : 'HeftCoder AI'}
                </h2>
                <p className="text-sm text-zinc-500 mb-8 text-center max-w-xs">
                    {isBuilding ? (buildStatus || 'Initializing environment...') : 'Ready to build something amazing'}
                </p>

                <div className="flex gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-orange-500/40 animate-bounce' : 'bg-green-500'}`} style={{ animationDelay: '0ms' }} />
                    <span className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-orange-500/60 animate-bounce' : 'bg-yellow-500'}`} style={{ animationDelay: '150ms' }} />
                    <span className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-orange-500/80 animate-bounce' : 'bg-orange-500'}`} style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
