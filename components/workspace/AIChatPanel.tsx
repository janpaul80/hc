"use client";

import React, { useState, useRef } from 'react';
import { Send, Paperclip, AudioWaveform, Sparkles, Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export default function AIChatPanel({
    projectName = 'VIBE ENGINE',
    messages,
    currentStage,
    onSendMessage,
    isGenerating,
    chatInput,
    setChatInput
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
                    <span className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">
                        {projectName}
                    </span>
                </div>
                {isGenerating && (
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" />
                        </div>
                        <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">AI Thinking</span>
                    </div>
                )}
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-auto p-5 scrollbar-hide">
                <div className="space-y-6">
                    {messages.map((msg, i) => (
                        <div key={i} className={cn(
                            "flex flex-col gap-2 max-w-[90%]",
                            msg.role === 'user' ? "ml-auto items-end" : "items-start"
                        )}>
                            <div className={cn(
                                "px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-zinc-100 text-zinc-900 rounded-tr-none"
                                    : "bg-white/5 text-zinc-300 border border-white/5 rounded-tl-none"
                            )}>
                                {msg.content}
                            </div>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight px-1">
                                {msg.role === 'user' ? 'You' : 'HeftCoder AI'}
                            </span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-5 bg-gradient-to-t from-[#0a0a0a] to-transparent">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.fig,.figma,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <div className="flex items-end gap-2 bg-[#121212] rounded-2xl px-4 py-3 border border-[#222] focus-within:border-orange-500/30 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-300 shadow-xl">
                    <button
                        onClick={handleFileClick}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors mb-0.5"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>

                    <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (chatInput.trim() && !isGenerating) onSendMessage(chatInput);
                            }
                        }}
                        placeholder="Vibe something into existence..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none py-1.5 max-h-32"
                    />

                    <div className="flex items-center gap-1.5 mb-0.5">
                        <button
                            onClick={handleVoiceClick}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                isRecording
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "hover:bg-white/5 text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <AudioWaveform className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => chatInput.trim() && !isGenerating && onSendMessage(chatInput)}
                            disabled={!chatInput.trim() || isGenerating}
                            className={cn(
                                "p-2.5 rounded-xl transition-all duration-300 shadow-lg",
                                chatInput.trim() && !isGenerating
                                    ? "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/40"
                                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            )}
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple internal icon for demo
const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
