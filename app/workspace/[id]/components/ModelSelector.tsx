import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OpenAIIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9066 6.0462 6.0462 0 0 0-4.445-2.9155 6.0073 6.0073 0 0 0-5.6381 2.3848 6.0134 6.0134 0 0 0-5.4505-1.0888 6.0524 6.0524 0 0 0-4.0026 3.4936 6.0073 6.0073 0 0 0 .8093 6.2202 5.9847 5.9847 0 0 0 .5154 4.9056 6.0462 6.0462 0 0 0 4.4451 2.9155 6.0072 6.0072 0 0 0 5.638-2.3858 6.0134 6.0134 0 0 0 5.4515 1.0888 6.0524 6.0524 0 0 0 4.0026-3.4936 6.0073 6.0073 0 0 0-.8094-6.2202ZM12.0947 15.6637l-1.339-1.339s.0232-.0163.064-.0408l2.0543-1.1856c.1537-.0897.2842-.217.3789-.3684l1.339-2.1265s.0337-.0245.0932-.0164l2.1266 1.339s.0163.0245.0163.064l.0163 2.502c-.001.1711-.0618.3364-.1714.4716L15.341 16.326s-.0245.0337-.064.049l-3.2642 .0163s-.0163 0-.0163-.0163V15.6637Zm-.2082-1.3061-2.1265-1.339s-.0163-.0245-.0163-.064l.0163-4.098c.002-.1711.0628-.3364.1724-.4716L11.3344 7.221s.0245-.0337.064-.049l2.1265 1.339s.0163.0245.0163.064l-.0163 4.098c-.002.1711-.0628.3364-.1724.4716l-1.339 1.1857s-.0246.0337-.064.049l-.048-.0245Zm-2.3333 1.3061-1.339-2.1265s-.0245-.0337-.0163-.0932l1.339-2.1265s.0245-.0163.064-.0163l4.098.0163s.0337.0163.049.064l1.339 2.1265s.0245.0337.0163.0932l-1.339 2.1265s-.0245.0163-.064.0163l-4.098-.0163s-.0337-.0163-.049-.064l-.048-.0245ZM6.6579 16.326l-1.339-2.1265s-.0245-.0337-.0163-.0933l1.1857-1.339s.0337-.0245.049-.0163l4.098 2.1265s.0245.0163.0245.064l1.339 2.1265s.0245.0337.0163.0932l-1.1857 1.339s-.0337.0245-.049.0164L6.6579 16.326Zm-.2082-2.3333-2.1265-1.339s-.0163-.0245-.0163-.064l.0163-4.098c.002-.1711.0628-.3364.1724-.4716l1.339-1.1857s.0245-.0337.064-.049l2.1265 1.339s.0163.0245.0163.064l-.0163 4.098c-.002.1711-.0628.3364-.1724.4716l-1.339 1.1857s-.0245.0337-.064.049l-.048-.0245ZM11.1224 4.6579l1.339 2.1265s.0245.0337.0163.0932l-1.1856 1.339s-.0337.0245-.049.0164L7.1461 6.1065s-.0245-.0163-.0245-.064L5.7826 3.916s-.0245-.0337-.0163-.0932l1.1856-1.3389s.0337-.0245.049-.0164L10.9714 4.542l.151.1159Z" fill="white" />
    </svg>
);

const AnthropicIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 18H7.5L9.5 13.5H14.5L16.5 18H20L12 2ZM12 7.5L13.8 11.5H10.2L12 7.5Z" fill="#ff7f50" />
    </svg>
);

const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="white" />
    </svg>
);

const DeepSeekIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#3B82F6" />
        <path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6ZM12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12C16 14.209 14.209 16 12 16Z" fill="white" />
    </svg>
);

const MistralIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 22L12 18L20 22L12 2Z" fill="#f97316" />
    </svg>
);

const FluxIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#8B5CF6" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
        <path d="M21 15L16 10L5 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MetaIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" fill="#0668E1" />
        <path d="M12 6c-3.313 0-6 2.687-6 6s2.687 6 6 6 6-2.687 6-6-2.687-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" fill="#0668E1" />
    </svg>
);

const KimiIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 19.5h20L12 2z" fill="#FF4F00" />
    </svg>
);

const SoraIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.5 7c0-1.1-.9-2-2-2H3.5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h17c1.1 0 2-.9 2-2V7zM10 14.5v-5l4.5 2.5-4.5 2.5z" fill="#8B5CF6" />
    </svg>
);

const MODELS = [
    { id: "heft-orchestrator", name: "Heft Orchestrator", icon: OpenAIIcon, color: "text-[#10a37f]", pro: true },
    { id: "codestral", name: "Codestral 2501", icon: MistralIcon, color: "text-orange-400", pro: true },
    { id: "mistral-large", name: "Mistral Large 3", icon: MistralIcon, color: "text-orange-600", pro: true },
    { id: "mistral-medium", name: "Mistral Medium", icon: MistralIcon, color: "text-orange-500", pro: false },
    { id: "grok-4", name: "Grok 4 (thinking)", icon: XIcon, color: "text-white", pro: true },
    { id: "deepseek-v3.1", name: "DeepSeek v3.1", icon: DeepSeekIcon, color: "text-blue-500", pro: false },
    { id: "llama-4", name: "Llama 4 Maverick", icon: MetaIcon, color: "text-blue-600", pro: true },
    { id: "kimi-k2", name: "Kimi K2 Thinking", icon: KimiIcon, color: "text-[#FF4F00]", pro: true },
    { id: "flux.2-pro", name: "Flux.2-Pro", icon: FluxIcon, color: "text-purple-500", pro: true },
    { id: "sora", name: "Sora Video Gen", icon: SoraIcon, color: "text-purple-400", pro: true },
];

export function ModelSelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[240px] bg-[#0f0f13] border border-white/5 text-white h-10 rounded-xl shadow-xl hover:border-white/10 transition-all">
                <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f13] border border-white/5 text-white rounded-xl shadow-2xl p-1">
                {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="focus:bg-white/5 focus:text-white cursor-pointer rounded-lg py-2.5 px-3 my-0.5 transition-colors">
                        <div className="flex items-center justify-between w-full min-w-[180px]">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <m.icon />
                                </div>
                                <span className={`text-sm font-medium ${m.id === value ? 'text-white' : 'text-gray-400'}`}>
                                    {m.name}
                                </span>
                            </div>
                            {m.pro && (
                                <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter">
                                    PRO
                                </span>
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
