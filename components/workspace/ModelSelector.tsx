"use client";

import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    HeftCoderProIcon,
    HeftCoderPlusIcon,
    OpusIcon,
    ClaudeIcon,
    ChatGPTIcon,
    GeminiIcon,
    MistralIcon
} from './ModelIcons';
import { ModelID } from '@/lib/ai/engine';

const models = [
    { id: 'heft-coder-thinking', name: 'HeftCoder Pro', icon: HeftCoderProIcon, tag: 'Recommended' },
    { id: 'llama-70b', name: 'HeftCoder Plus', icon: HeftCoderPlusIcon, tag: null },
    { id: 'heft-coder-thinking', name: 'Opus 4.5 Reasoning Pro', icon: OpusIcon, tag: 'Reasoning' },
    { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5 Pro', icon: ClaudeIcon, tag: null },
    { id: 'gpt-4o', name: 'ChatGPT 5.1 Pro', icon: ChatGPTIcon, tag: 'Fast' },
    { id: 'gemini-flash', name: 'Gemini 2.5 Flash', icon: GeminiIcon, tag: 'Flash' },
    { id: 'mistral-medium', name: 'Mistral Medium', icon: MistralIcon, tag: null },
];

interface ModelSelectorProps {
    selectedModel: ModelID;
    onModelChange: (id: ModelID) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
    // Map internal technical IDs to the display models
    const currentModel = models.find(m => m.id === selectedModel) || models[0];
    const IconComponent = currentModel.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 px-4 py-2 bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 rounded-xl transition-all duration-300 group shadow-lg">
                    <IconComponent className="w-5 h-5 shadow-inner" />
                    <span className="text-xs font-bold text-zinc-300 tracking-tight">{currentModel.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-72 bg-[#0d0d0d] border-white/10 p-2 shadow-2xl rounded-2xl"
                align="end"
            >
                <div className="px-3 py-2 mb-1">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Select Intelligence</span>
                </div>
                {models.map((model) => {
                    const Icon = model.icon;
                    const isSelected = model.id === selectedModel;
                    return (
                        <DropdownMenuItem
                            key={model.id}
                            onClick={() => onModelChange(model.id as ModelID)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 focus:bg-white/5 focus:text-white ${isSelected ? 'bg-orange-500/10 border border-orange-500/20' : 'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <Icon className="w-6 h-6 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col">
                                    <span className={`text-xs font-bold ${isSelected ? 'text-orange-500' : 'text-zinc-300'}`}>
                                        {model.name}
                                    </span>
                                    {model.tag && (
                                        <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isSelected ? 'text-orange-400' : 'text-zinc-600'}`}>
                                            {model.tag}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isSelected && (
                                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                </div>
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
