import React from 'react';

export const HeftCoderProIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#heftpro)" />
        <path d="M8 8v8M8 12h8M16 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="heftpro" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF6B35" />
                <stop offset="1" stopColor="#F7931E" />
            </linearGradient>
        </defs>
    </svg>
);

export const HeftCoderPlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#heftplus)" />
        <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="heftplus" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#A855F7" />
            </linearGradient>
        </defs>
    </svg>
);

export const OpusIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" fill="url(#opus)" />
        <path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" fill="#fff" />
        <defs>
            <linearGradient id="opus" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D97706" />
                <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
        </defs>
    </svg>
);

export const ClaudeIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#claude)" />
        <path d="M9 9c0-1.5 1.5-2 3-2s3 .5 3 2c0 3-6 2-6 5 0 1 1 2 3 2s3-1 3-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="claude" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#CC785C" />
                <stop offset="1" stopColor="#D4A574" />
            </linearGradient>
        </defs>
    </svg>
);

export const ChatGPTIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" fill="url(#gpt)" />
        <path d="M12 7v5l3 3M9 10h6M9 14h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="gpt" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10A37F" />
                <stop offset="1" stopColor="#1A7F64" />
            </linearGradient>
        </defs>
    </svg>
);

export const GeminiIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L3 12l9 9 9-9-9-9z" fill="url(#gemini)" />
        <circle cx="12" cy="12" r="3" fill="#fff" fillOpacity="0.9" />
        <defs>
            <linearGradient id="gemini" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4285F4" />
                <stop offset="0.5" stopColor="#9B72CB" />
                <stop offset="1" stopColor="#D96570" />
            </linearGradient>
        </defs>
    </svg>
);

export const MistralIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="url(#mistral)" />
        <path d="M7 8h2v8H7V8zM11 8h2v8h-2V8zM15 8h2v8h-2V8z" fill="#fff" />
        <defs>
            <linearGradient id="mistral" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF7000" />
                <stop offset="1" stopColor="#FF9500" />
            </linearGradient>
        </defs>
    </svg>
);
