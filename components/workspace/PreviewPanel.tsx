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

    // Combined State with Overlay
    return (
        <div className="h-full flex flex-col bg-[#0d0d0d] rounded-lg overflow-hidden border border-[#1f1f1f] relative group">
            {/* Browser Header Overlay */}
            <div className="h-10 bg-[#0a0a0a] flex items-center px-4 gap-3 border-b border-white/5 z-20 relative">
                {/* Branded Icon */}
                <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3L6 13h5l-2 8 7-10h-5l4-8z" />
                    </svg>
                </div>

                {/* URL Bar */}
                <div className="flex-1 bg-[#141414] rounded-md text-[10px] py-1 px-3 text-zinc-500 font-mono border border-white/5 flex items-center justify-center">
                    <span className="text-orange-500 mr-1">🔒</span> vibe-preview.heftcoder.app
                </div>

                <button className="p-1.5 hover:bg-white/5 rounded text-zinc-500 transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 preview-container relative bg-white">
                <SandpackPreview
                    showNavigator={false}
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    className="h-full w-full"
                />

                {/* Smooth Overlay for "Working" State */}
                <div
                    className={`absolute inset-0 bg-[#050505] z-10 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out ${isBuilding || !isReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                >
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                        {/* Glowing Icon Container */}
                        <div className={`w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-8 ring-1 ring-orange-500/20 relative`}>
                            {/* Inner Glow Pulse */}
                            <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 animate-pulse"></div>
                            <svg className={`w-10 h-10 text-orange-500 relative z-10 ${isBuilding ? 'animate-pulse' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 3L6 13h5l-2 8 7-10h-5l4-8z" />
                            </svg>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                                HeftCoder is working...
                            </h2>

                            {/* Simple clean loading dots */}
                            <div className="flex items-center gap-1.5 h-4 opacity-50">
                                <span className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
