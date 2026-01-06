"use client";

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface PreviewPanelProps {
    isBuilding: boolean;
    isReady: boolean;
    port?: number;
    error?: string;
    buildStatus?: string;
}

export function PreviewPanel({ isBuilding, isReady, port, error, buildStatus }: PreviewPanelProps) {
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

    // Default State: No app running
    if (!isBuilding && !isReady && !error) {
        return (
            <div className="h-full bg-[#0f0f0f] flex flex-col items-center justify-center">
                {/* HashCoder Logo with Glow */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">HC</span>
                        </div>
                    </div>
                </div>

                {/* Status Text */}
                <h3 className="text-white text-lg font-medium mb-2">HashCoder IDE</h3>
                <p className="text-gray-500 text-sm">Ready to build something amazing</p>

                {/* Subtle Animation */}
                <div className="mt-8 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-orange-500/50 animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 rounded-full bg-orange-500/50 animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
            </div>
        );
    }

    // Building State
    if (isBuilding) {
        return (
            <div className="h-full bg-[#0f0f0f] flex flex-col items-center justify-center">
                {/* Spinning Logo */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                    <Loader2 className="relative w-24 h-24 text-orange-500 animate-spin" />
                </div>

                {/* Build Status */}
                <h3 className="text-white text-lg font-medium mb-2">
                    Building{dots}
                </h3>
                <p className="text-gray-400 text-sm max-w-md text-center">
                    {buildStatus || 'Preparing your application'}
                </p>

                {/* Progress Indicators */}
                <div className="mt-8 w-64 space-y-2">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>Dependencies installed</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                        <span>Compiling application...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="h-full bg-[#0f0f0f] flex flex-col items-center justify-center p-8">
                <div className="bg-red-950/20 border border-red-900 rounded-lg p-6 max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <h3 className="text-white font-medium">Build Failed</h3>
                    </div>
                    <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                        {error}
                    </pre>
                </div>
            </div>
        );
    }

    // Ready State: Show iframe
    if (isReady && port) {
        return (
            <div className="h-full bg-white flex flex-col">
                {/* Status Bar */}
                <div className="h-8 bg-[#0a0a0a] border-b border-gray-800 flex items-center px-4 gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-gray-400">
                        Preview running on port {port}
                    </span>
                </div>

                {/* Preview Iframe */}
                <iframe
                    src={`http://localhost:${port}`}
                    className="flex-1 w-full"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                />
            </div>
        );
    }

    // Fallback
    return (
        <div className="h-full bg-[#0f0f0f] flex items-center justify-center">
            <p className="text-gray-500 text-sm">Initializing...</p>
        </div>
    );
}
