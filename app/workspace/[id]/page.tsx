"use client";
import React, { useState, useRef, useEffect, use } from "react";
import {
    Play,
    Share2,
    UploadCloud,
    Github,
    PanelLeftClose,
    PanelLeftOpen,
    GitBranch,
    Rocket,
    Globe,
    Search,
    Settings,
    MoreHorizontal,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ModelSelector from "@/components/workspace/ModelSelector";
import PreviewPanel from "@/components/workspace/PreviewPanel";
import { ThinkingIndicator } from "@/components/workspace/ThinkingIndicator";
import { StageProgress, ArtifactMessage } from "@/components/workspace/ChatArtifacts";
import { ConversationalAgent } from "@/lib/agent/conversational";
import { Message, WorkspaceState, AgentEvent } from "@/types/workspace";
import { UserIntent } from "@/lib/agent/intent";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { monokaiPro } from "@codesandbox/sandpack-themes";
import Link from "next/link";
import FileTree from "@/components/workspace/FileTree";
import CodePanel from "@/components/workspace/CodePanel";
import AIChatPanel from "@/components/workspace/AIChatPanel";
import { cn } from "@/lib/utils";
import { ModelID } from "@/lib/ai/engine";

export default function Workspace(props: { params: Promise<{ id: string }> }) {
    // Safely unwrap params using React.use() if it's a promise
    const params = React.use(props.params);
    const projectId = params?.id;

    const [activeFile, setActiveFile] = useState("App.tsx");
    const [chatInput, setChatInput] = useState("");
    const [selectedModel, setSelectedModel] = useState<ModelID>("heftcoder-pro");
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hello! I'm your orchestrator. How can I help you build today?" }
    ]);

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [agentMode, setAgentMode] = useState<'discussion' | 'planning' | 'building'>('discussion');
    const [thinkingAction, setThinkingAction] = useState<'thinking' | 'writing' | 'building'>('thinking');
    const [currentStage, setCurrentStage] = useState<'planning' | 'approving' | 'coding'>('planning');
    const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => {
        // Initialize workspaceState with projectId if available, otherwise an empty ID
        return {
            id: projectId || "",
            currentPlan: null,
            planStatus: "none"
        };
    });

    // Update workspace state ID when projectId resolves
    useEffect(() => {
        if (projectId && workspaceState.id === "") { // Only update if ID is not already set
            setWorkspaceState(prev => ({ ...prev, id: projectId }));
        }
    }, [projectId, workspaceState.id]);
    const [currentIntent, setCurrentIntent] = useState<UserIntent | null>(null);
    const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
    const [hasBuilt, setHasBuilt] = useState(false);
    const [buildStep, setBuildStep] = useState<string>('');

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    const buildIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Inject custom scrollbar styles safely
    useEffect(() => {
        const styleId = 'heft-scrollbar-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `;
            document.head.appendChild(style);
        }
        return () => {
            // Optional cleanup if needed, but usually fine to keep
        };
    }, []);

    // Auto-detect entry file if content changes
    useEffect(() => {
        if (!project?.files) return;
        if (project.files[activeFile]) return;

        const candidates = ['/src/App.tsx', '/src/index.tsx', '/src/main.tsx', '/App.tsx', '/index.js', 'App.tsx', 'index.js'];
        for (const candidate of candidates) {
            if (project.files[candidate]) {
                setActiveFile(candidate);
                return;
            }
        }
        const firstFile = Object.keys(project.files)[0];
        if (firstFile) setActiveFile(firstFile);
    }, [project]);

    // Fetch project data
    useEffect(() => {
        if (!projectId) return;

        const fetchProject = async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}`);
                if (!response.ok) throw new Error("Project not found");
                const data = await response.json();
                setProject(data.project);
            } catch (err) {
                console.error("Fetch project error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    // Initialize messages from persisted chat history
    useEffect(() => {
        if (!project?.files || historyLoaded) return;
        const persistedHistory = project.files[".heftcoder/chat.json"];
        if (persistedHistory) {
            try {
                const history = JSON.parse(persistedHistory);
                if (Array.isArray(history) && history.length > 0) {
                    setMessages(history);
                    setHistoryLoaded(true);
                }
            } catch (e) {
                console.error("Failed to parse persisted history:", e);
            }
        }
    }, [project?.id, historyLoaded]);

    const handleSendMessage = async (input?: string) => {
        const userPrompt = input || chatInput;
        if (!userPrompt || isGenerating) return;

        const updatedMessages: Message[] = [...messages, { role: "user", content: userPrompt }];
        setMessages(updatedMessages);
        setIsGenerating(true);
        setChatInput("");

        const intent = ConversationalAgent.detectIntent(userPrompt);
        setCurrentIntent(intent);

        // --- GREETING GUARD (Client-side Short Circuit) ---
        if (intent === UserIntent.GREETING) {
            setAgentMode('discussion');
            setThinkingAction('thinking');
            setTimeout(() => {
                setMessages(prev => [...prev, { role: "ai", content: "Hey 👋 What would you like to build or change today?" }]);
                setIsGenerating(false);
            }, 600);
            return;
        }

        const mode = ConversationalAgent.intentToMode(intent, workspaceState);
        setAgentMode(mode.type);
        setCurrentIntent(intent); // Ensure intent is set

        if (intent === UserIntent.QUESTION) {
            setThinkingAction('thinking');
            setCurrentStage('planning');
        } else if (intent === UserIntent.PLAN_REQUEST || intent === UserIntent.EDIT_PLAN) {
            setThinkingAction('thinking');
            setCurrentStage('planning');
        } else if (intent === UserIntent.APPROVAL || intent === UserIntent.CODE_REQUEST) {
            setThinkingAction('writing');
            setCurrentStage('coding');

            // Start Build Simulation
            setHasBuilt(false);
            const steps = [
                "Thinking...",
                "Analyzing requirements...",
                "Planning app architecture...",
                "Simulating npm install...",
                "installing react@latest...",
                "installing next@latest...",
                "installing tailwindcss...",
                "Generating UI components...",
                "Writing API routes...",
                "Validating syntax...",
                "Checking type safety...",
                "Self-correcting detected errors...",
                "Finalizing build..."
            ];
            let stepIndex = 0;
            setBuildStep(steps[0]);

            if (buildIntervalRef.current) clearInterval(buildIntervalRef.current);
            buildIntervalRef.current = setInterval(() => {
                stepIndex = (stepIndex + 1) % steps.length;
                setBuildStep(steps[stepIndex]);
            }, 2000);
        }

        try {
            const response = await fetch("/api/agent/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: projectId,
                    prompt: userPrompt,
                    fileContext: project?.files,
                    model: selectedModel,
                    workspaceState,
                    messages: messages
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Generation failed");
            }

            const data = await response.json();

            if (data.intent && !data.shouldModifyFiles) {
                const aiMsg = data.response.content;
                setMessages(prev => [...prev, { role: "ai", content: aiMsg }]);

                if (data.intent === UserIntent.PLAN_REQUEST || data.intent === UserIntent.EDIT_PLAN || data.response.isPlan) {
                    setWorkspaceState(prev => ({
                        ...prev,
                        planStatus: "proposed",
                        currentPlan: { summary: aiMsg, steps: [] }
                    }));
                    setCurrentStage('approving');
                }
            } else if (data.shouldModifyFiles) {
                setAgentEvents(data.agentResponse?.events || []);
                setMessages(prev => [...prev, { role: "ai", content: "✅ Code generation complete! I've updated your files." }]);
                setHasBuilt(true);

                if (data.intent === UserIntent.APPROVAL) {
                    setWorkspaceState(prev => ({ ...prev, planStatus: "approved" }));
                }

                // Refetch project
                const refetch = await fetch(`/api/projects/${projectId}`);
                const updated = await refetch.json();
                if (updated.project) {
                    setProject(updated.project);
                }
            }

        } catch (error: any) {
            console.error("Generation error:", error);
            setMessages(prev => [...prev, { role: "ai", content: `❌ Error: ${error.message}` }]);
        } finally {
            if (buildIntervalRef.current) {
                clearInterval(buildIntervalRef.current);
                buildIntervalRef.current = null;
            }
            setIsGenerating(false);
        }
    };

    // Transform flat project files for FileTree
    const getFileTree = () => {
        if (!project?.files) return [];
        const files = Object.keys(project.files)
            .filter(path => !path.split('/').some(part => part.startsWith('.'))) // Hide hidden files/folders
            .map(path => {
                const parts = path.split('/').filter(p => p);
                return { name: parts[parts.length - 1], type: 'file' as const, path };
            });
        return files;
    };

    if (loading) {
        return (
            <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Initializing Workspace</p>
            </div>
        );
    }

    return (
        <SandpackProvider
            template="react"
            theme={monokaiPro}
            files={project?.files && Object.keys(project.files).length > 0 ? project.files : { "App.tsx": "// Vibe something into existence..." }}
            options={{
                visibleFiles: Object.keys(project?.files && Object.keys(project.files).length > 0 ? project.files : { "App.tsx": "" }),
                activeFile: activeFile,
            }}
        >
            <div className="h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col overflow-hidden font-sans">
                {/* Header */}
                <header className="h-14 bg-[#070707] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-50 relative">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 3L6 13h5l-2 8 7-10h-5l4-8z" />
                                </svg>
                            </div>
                            <span className="font-black text-white tracking-tighter text-lg uppercase">HEFTCoder</span>
                        </Link>

                        <div className="h-4 w-px bg-white/10" />

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Project /</span>
                            <span className="text-xs font-bold text-zinc-300">{project?.name || "Untitled"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                        />

                        <div className="flex items-center bg-[#141414] rounded-xl p-1 border border-white/5">
                            <button onClick={() => alert("Connecting to GitHub...")} className="group relative flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase tracking-tight active:scale-95">
                                <Github className="w-3.5 h-3.5" />
                                Push
                                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded text-[9px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none">Push to GitHub</span>
                            </button>
                            <button onClick={() => alert("Connecting to Vercel...")} className="group relative flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase tracking-tight active:scale-95">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1L24 22H0L12 1Z" /></svg>
                                Deploy
                                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded text-[9px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none">Deploy to Vercel</span>
                            </button>

                            <div className="relative group z-50">
                                <button className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-all shadow-lg shadow-orange-900/20 uppercase tracking-tight active:scale-95">
                                    <Globe className="w-3.5 h-3.5" />
                                    Publish
                                    <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                                </button>
                                {/* Dropdown Menu (Pure CSS Group Hover) */}
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl p-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto scale-95 group-hover:scale-100 origin-top-right z-[60] flex flex-col gap-1">
                                    <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left w-full">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] text-orange-500">h</div>
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Subdomain</div>
                                            project.heftcoder.icu
                                        </div>
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left w-full">
                                        <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-500">@</div>
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Custom Domain</div>
                                            yourdomain.com
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden relative">
                    {/* Sidebar */}
                    <aside className={cn(
                        "bg-[#070707] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative z-10",
                        sidebarOpen ? "w-64" : "w-0"
                    )}>
                        {sidebarOpen && (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#0a0a0a]">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Workspace Explorer</span>
                                    <button className="p-1 rounded hover:bg-white/5 text-zinc-500 transition-colors">
                                        <Search className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                                    <FileTree
                                        files={getFileTree()}
                                        selectedFile={activeFile}
                                        onSelectFile={setActiveFile}
                                    />
                                </div>
                                <div className="p-3 border-t border-white/5">
                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest">
                                        <Settings className="w-3.5 h-3.5" />
                                        Settings
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Toggle Sidebar Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={cn(
                            "absolute top-6 z-20 p-1.5 bg-[#141414] border border-white/10 hover:border-orange-500/50 rounded-full transition-all duration-300 shadow-2xl",
                            sidebarOpen ? "left-60" : "left-4"
                        )}
                    >
                        {sidebarOpen ? (
                            <PanelLeftClose className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                            <PanelLeftOpen className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                    </button>

                    {/* Editor Content Area */}
                    <div className="flex-1 flex overflow-hidden p-4 gap-4">
                        <ResizablePanelGroup direction="horizontal">
                            {/* Editor */}
                            <ResizablePanel defaultSize={45}>
                                <CodePanel
                                    fileName={activeFile}
                                    code={project?.files?.[activeFile] || ""}
                                />
                            </ResizablePanel>

                            <ResizableHandle className="bg-transparent w-2 group">
                                <div className="h-8 w-1 bg-white/10 rounded-full mx-auto group-hover:bg-orange-500/50 transition-colors" />
                            </ResizableHandle>

                            {/* AI Chat */}
                            <ResizablePanel defaultSize={30}>
                                <AIChatPanel
                                    projectName={project?.name || "VIBE ENGINE"}
                                    messages={messages}
                                    currentStage={currentStage}
                                    onSendMessage={handleSendMessage}
                                    onApprove={() => handleSendMessage("build this")}
                                    isGenerating={isGenerating}
                                    chatInput={chatInput}
                                    setChatInput={setChatInput}
                                    selectedModel={selectedModel}
                                />
                            </ResizablePanel>

                            <ResizableHandle className="bg-transparent w-2 group">
                                <div className="h-8 w-1 bg-white/10 rounded-full mx-auto group-hover:bg-orange-500/50 transition-colors" />
                            </ResizableHandle>

                            {/* Preview */}
                            <ResizablePanel defaultSize={25}>
                                <PreviewPanel
                                    isBuilding={!hasBuilt || (isGenerating && currentStage === 'coding')}
                                    isReady={!isGenerating}
                                    buildStatus={buildStep}
                                    port={3000}
                                />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </main>
            </div>
        </SandpackProvider>
    );
}
