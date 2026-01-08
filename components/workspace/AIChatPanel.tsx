"use client";

import React, { useState, useRef } from 'react';
import { Send, Paperclip, AudioWaveform, Sparkles, Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArtifactMessage } from './ChatArtifacts';
import { ThinkingIndicator } from './ThinkingIndicator';

const STAGES = [
    { id: 'planning', label: 'Planning' },
    { id: 'approval', label: 'Approval' },
    { id: 'coding', label: 'Coding' },
];

interface AIChatPanelProps {
    projectName?: string;
    messages: any[];
    currentStage: 'planning' | 'approving' | 'coding';
    onSendMessage: (msg: string) => void;
    isGenerating: boolean;
    chatInput: string;
    setChatInput: (val: string) => void;
    selectedModel: string;
    onApprove?: () => void;
}

const getModelName = (id: string) => {
    switch (id) {
        case 'heftcoder-pro': return 'HeftCoder Pro';
        case 'heftcoder-plus': return 'HeftCoder Plus';
        case 'opus-reasoning': return 'Opus 4.5 Reasoning';
        case 'claude-sonnet-4.5': return 'Claude Sonnet 4.5';
        case 'chatgpt-thinking': return 'ChatGPT 5.1 Thinking';
        case 'gemini-flash': return 'Gemini 2.5 Flash';
        case 'ui-architect': return 'UI Architect';
        case 'debugger-pro': return 'Debugger Pro';
        default: return 'HeftCoder AI';
    }
};

export default function AIChatPanel({
    projectName = 'VIBE ENGINE',
    messages,
    currentStage,
    onSendMessage,
    isGenerating,
    chatInput,
    setChatInput,
    selectedModel,
    onApprove
}: AIChatPanelProps) {
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            console.log('Files selected:', Array.from(files).map(f => f.name));
        }
    };

    const handleVoiceClick = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser');
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setChatInput(chatInput + transcript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (chatInput.trim()) onSendMessage(chatInput);
        }
    };

    const getStageStatus = (stageId: string) => {
        const stageOrder = ['planning', 'approving', 'coding'];
        const currentIndex = stageOrder.indexOf(currentStage);
        const stageIndex = stageId === 'approval' ? 1 : (stageId === 'planning' ? 0 : 2);

        if (stageIndex < currentIndex) return 'completed';
        if (stageIndex === currentIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="h-full flex flex-col bg-[#0d0d0d] rounded-lg overflow-hidden border border-[#1f1f1f] shadow-2xl">
            {/* Stage Progress */}
            <div className="px-5 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="flex items-center justify-between">
                    {STAGES.map((stage, idx) => {
                        const status = getStageStatus(stage.id);
                        return (
                            <React.Fragment key={stage.id}>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-all duration-300",
                                        status === 'active' && "bg-orange-500 text-white border-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.4)]",
                                        status === 'completed' && "bg-green-500 text-white border-green-400",
                                        status === 'pending' && "bg-[#1a1a1a] text-zinc-600 border-[#2a2a2a]"
                                    )}>
                                        {status === 'completed' ? (
                                            <Check className="w-3 h-3" strokeWidth={3} />
                                        ) : status === 'active' ? (
                                            <Sparkles className="w-3 h-3" />
                                        ) : (
                                            <Circle className="w-3 h-3 fill-current" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                                        status === 'active' && "text-white",
                                        status === 'completed' && "text-green-500/80",
                                        status === 'pending' && "text-zinc-700"
                                    )}>
                                        {stage.label}
                                    </span>
                                </div>
                                {idx < STAGES.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-[2px] mx-3 rounded-full transition-colors duration-500",
                                        getStageStatus(STAGES[idx + 1].id) !== 'pending' ? "bg-green-500/20" : "bg-[#1a1a1a]"
                                    )} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-[#1a1a1a] flex items-center justify-between bg-[#080808]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
                    <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">
                        HEFTCODER PRO AI
                    </span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-2 border-l border-zinc-800 pl-2">
                        {projectName}
                    </span>
                </div>
                {isGenerating && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" />
                        </div>
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">Thinking...</span>
                    </div>
                )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                            msg.role === 'user'
                                ? "bg-[#1a1a1a] border-[#2a2a2a]"
                                : "bg-orange-500/10 border-orange-500/20"
                        )}>
                            {msg.role === 'user' ? (
                                <div className="w-4 h-4 rounded-full bg-zinc-400" />
                            ) : (
                                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 3L6 13h5l-2 8 7-10h-5l4-8z" />
                                </svg>
                            )}
                        </div>
                        <div className={cn(
                            "max-w-[90%] rounded-2xl px-5 py-3 text-sm font-medium leading-relaxed tracking-wide shadow-sm",
                            msg.role === 'user'
                                ? "bg-[#1a1a1a] text-zinc-200 border border-[#2a2a2a]"
                                : "bg-[#0a0a0a] text-zinc-300 border border-[#1f1f1f]"
                        )}>
                            {msg.role === 'user' ? (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            ) : (
                                <ArtifactMessage
                                    content={msg.content}
                                    onApprove={onApprove}
                                />
                            )}
                        </div>
                    </div>
                ))}
                {isGenerating && (
                    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            {/* Official HeftCoder Icon with Glow/Pulse */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 animate-pulse"></div>
                                <svg className="w-4 h-4 text-orange-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 3L6 13h5l-2 8 7-10h-5l4-8z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-[#0a0a0a] px-4 py-3 rounded-2xl border border-[#1f1f1f]">
                            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-[#0a0a0a] border-t border-[#1a1a1a]">
                <div className="relative flex items-end bg-[#0d0d0d] rounded-xl border border-[#1f1f1f] focus-within:border-orange-500/50 transition-colors shadow-lg shadow-black/50 overflow-hidden">
                    <button
                        onClick={handleFileClick}
                        className="p-3 mb-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                    />

                    <textarea
                        value={chatInput}
                        onChange={(e) => {
                            setChatInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (chatInput.trim()) onSendMessage(chatInput);
                            }
                        }}
                        rows={1}
                        placeholder={currentStage === 'approving' ? "Review and approve plan..." : "Brief the engine..."}
                        className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none appearance-none text-sm font-medium text-zinc-200 placeholder:text-zinc-700 py-3.5 px-0 min-h-[44px] max-h-[200px] resize-none overflow-y-auto"
                        disabled={isGenerating}
                        style={{ height: 'auto', outline: 'none', boxShadow: 'none' }}
                    />

                    <div className="flex items-center gap-1 pr-2 pb-2">
                        <button
                            onClick={handleVoiceClick}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-300",
                                isRecording
                                    ? "text-red-500 bg-red-500/10 animate-pulse"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            )}
                        >
                            <AudioWaveform className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => chatInput.trim() && onSendMessage(chatInput)}
                            disabled={!chatInput.trim() || isGenerating}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-300",
                                chatInput.trim() && !isGenerating
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-105"
                                    : "bg-[#1a1a1a] text-zinc-600 cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-3 px-1">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{getModelName(selectedModel)}</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">{chatInput.length} / 2000</span>
                </div>
            </div>

        </div>
    );
}
