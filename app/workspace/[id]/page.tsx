"use client";
import React, { useState, useRef, useEffect, use } from "react";
import { Play, Share2, UploadCloud, Github, Send, FileCode, ChevronRight, ChevronDown, Loader2, ArrowLeft, Paperclip, AudioLines, Image, FileUp, Figma, Code2, Sparkles, CheckCircle, XCircle, Terminal } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ModelSelector } from "./components/ModelSelector";
import { ActionList } from "@/components/workspace/ActionBlock";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import { ThinkingIndicator } from "@/components/workspace/ThinkingIndicator";
import { StageProgress, ArtifactMessage } from "@/components/workspace/ChatArtifacts";
import { ConversationalAgent } from "@/lib/agent/conversational";
import { AgentAction } from "@/lib/agent/actions";
import { Message, WorkspaceState, AgentEvent } from "@/types/workspace";
import { UserIntent } from "@/lib/agent/intent";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackFileExplorer
} from "@codesandbox/sandpack-react";
import { monokaiPro } from "@codesandbox/sandpack-themes";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Workspace(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [activeFile, setActiveFile] = useState("App.tsx");
    const [chatInput, setChatInput] = useState("");
    const [selectedModel, setSelectedModel] = useState("heftcoder-pro");
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hello! I'm your orchestrator. How can I help you build today?" }
    ]);

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [agentMode, setAgentMode] = useState<'discussion' | 'planning' | 'building'>('discussion');
    const [thinkingAction, setThinkingAction] = useState<'thinking' | 'writing' | 'building'>('thinking');
    const [currentStage, setCurrentStage] = useState<'planning' | 'approving' | 'coding'>('planning');
    const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
        id: params.id,
        currentPlan: null,
        planStatus: "none"
    });
    const [currentIntent, setCurrentIntent] = useState<UserIntent | null>(null);
    const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-detect entry file if content changes
    useEffect(() => {
        if (!project?.files) return;

        // If current active file exists, do nothing
        if (project.files[activeFile]) return;

        // Otherwise find a new best candidate
        const candidates = ['/src/App.tsx', '/src/index.tsx', '/src/main.tsx', '/App.tsx', '/index.js'];
        for (const candidate of candidates) {
            if (project.files[candidate]) {
                setActiveFile(candidate);
                return;
            }
        }
        // Fallback to first file
        const firstFile = Object.keys(project.files)[0];
        if (firstFile) setActiveFile(firstFile);
    }, [project, activeFile]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`/api/projects/${params.id}`);
                if (!response.ok) throw new Error("Failed to fetch project");

                const data = await response.json();
                setProject(data.project);
            } catch (err) {
                console.error("Error fetching project:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [params.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleDeploy = () => {
        alert("Deploying to Vercel... (Integration required via Vercel API)");
    };

    const handleGithubPush = () => {
        alert("Pushing to GitHub... (Integration required via GitHub App)");
    };

    const handleSendMessage = async () => {
        if (!chatInput || isGenerating) return;

        const userPrompt = chatInput;
        setMessages(prev => [...prev, { role: "user", content: userPrompt }]);
        setIsGenerating(true);
        setChatInput("");

        // Classify intent and update mode
        const intent = ConversationalAgent.detectIntent(userPrompt);
        const mode = ConversationalAgent.intentToMode(intent, workspaceState);
        setCurrentIntent(intent);
        setAgentMode(mode.type);

        // Update thinking action based on intent
        if (intent === UserIntent.GREETING || intent === UserIntent.QUESTION) {
            setThinkingAction('thinking');
        } else if (intent === UserIntent.PLAN_REQUEST || intent === UserIntent.EDIT_PLAN) {
            setThinkingAction('thinking');
            setCurrentStage('planning');
        } else if (intent === UserIntent.APPROVAL) {
            setThinkingAction('writing');
            setCurrentStage('coding');
        } else if (intent === UserIntent.CODE_REQUEST) {
            setThinkingAction('writing');
            setCurrentStage('coding');
        }

        try {
            const response = await fetch("/api/agent/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: params.id,
                    prompt: userPrompt,
                    fileContext: project?.files,
                    model: selectedModel,
                    workspaceState
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Generation failed");
            }

            const data = await response.json();

            if (data.failover) {
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: "⚠️ Fail-Safe Mode Active: Primary Vibe engine busy. Automatically re-routing to HeftCoder Plus (GPT-5.1) to ensure your progress is never lost."
                }]);
            }

            // Handle based on intent and response
            if (data.intent && !data.shouldModifyFiles) {
                // Chat-only response
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: data.response.content
                }]);

                // Update workspace state for planning
                if (data.intent === UserIntent.PLAN_REQUEST) {
                    setWorkspaceState(prev => ({
                        ...prev,
                        planStatus: "proposed",
                        currentPlan: {
                            summary: data.response.content,
                            steps: [] // Would parse from content
                        }
                    }));
                    setCurrentStage('approving');
                }
            } else if (data.imageUrl) {
                // Image response
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: "I've generated this image for you:",
                    imageUrl: data.imageUrl
                }]);
            } else if (data.shouldModifyFiles) {
                // Code generation - show activities
                setAgentEvents(data.agentResponse?.events || []);

                // Show coding activities in chat
                const activityMessages = (data.agentResponse?.events || []).map((event: AgentEvent) => {
                    switch (event.type) {
                        case "file:create":
                            return `📄 Creating file: ${event.path}`;
                        case "file:update":
                            return `📝 Updating file: ${event.path}`;
                        case "command":
                            return `⚡ Running: ${event.cmd}`;
                        default:
                            return "";
                    }
                }).filter(msg => msg);

                // Add activity messages
                activityMessages.forEach(msg => {
                    setMessages(prev => [...prev, { role: "ai", content: msg }]);
                });

                // Add final success message
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: "✅ Code generation complete!"
                }]);

                // Update workspace state
                if (data.intent === UserIntent.APPROVAL) {
                    setWorkspaceState(prev => ({
                        ...prev,
                        planStatus: "approved"
                    }));
                }
            }

            // Refetch project to show updates
            if (data.shouldModifyFiles) {
                const { data: updatedProject } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', params.id)
                    .single();
                if (updatedProject) setProject(updatedProject);
            }

        } catch (error: any) {
            console.error("Generation error:", error);
            setMessages(prev => [...prev, { role: "ai", content: `Error: ${error.message}` }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // TODO: Handle file upload to storage
            setChatInput(prev => prev + ` [Attached: ${file.name}]`);
        }
        setShowAttachMenu(false);
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser. Try Chrome.');
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = ''; // Auto-detect language

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setChatInput(prev => prev + transcript);
        };

        recognition.start();
    };

    return (
        <SandpackProvider
            template="react"
            theme={monokaiPro}
            files={project?.files || { "/App.tsx": "// Vibe something into existence..." }}
            options={{
                visibleFiles: Object.keys(project?.files || { "/App.tsx": "" }),
                activeFile: activeFile,
            }}
        >
            <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden font-sans">
                {/* Hidden file input */}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.txt,.tsx,.jsx,.ts,.js,.json,.css,.html" />

                {/* Top Navbar */}
                <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Back to Dashboard">
                            <ArrowLeft className="w-4 h-4 text-gray-400" />
                        </Link>
                        <span className="font-bold text-orange-500">HEFTCoder</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-sm">{project?.name || "Loading..."}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <ModelSelector value={selectedModel} onChange={setSelectedModel} />
                        <div className="flex items-center gap-3">
                            <button onClick={handleGithubPush} className="flex items-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition">
                                <Github className="w-3 h-3" /> Push
                            </button>
                            <button onClick={handleDeploy} className="flex items-center gap-2 text-xs bg-black border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-md transition">
                                <UploadCloud className="w-3 h-3" /> Deploy Vercel
                            </button>
                            <button className="flex items-center gap-2 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-md transition">
                                <Share2 className="w-3 h-3" /> Publish Subdomain
                            </button>
                        </div>
                    </div>
                </header>

                {/* 3-Pane Layout */}
                <div className="flex-1 flex overflow-hidden">
                    <ResizablePanelGroup direction="horizontal">
                        {/* Left: File Explorer */}
                        <ResizablePanel defaultSize={20} minSize={15}>
                            <div className="h-full bg-[#0a0a0a] border-r border-white/10 flex flex-col">
                                <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileCode className="w-3.5 h-3.5" /> Explorer
                                </div>
                                <div className="flex-1 overflow-y-auto codesandbox-explorer">
                                    <SandpackFileExplorer />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle className="bg-white/5 hover:bg-orange-500/20 transition-colors" />

                        {/* Middle: Chat / Code Interface */}
                        <ResizablePanel defaultSize={40} minSize={30}>
                            <div className="h-full flex flex-col border-r border-white/10 relative bg-[#0f0f0f]">
                                <ResizablePanelGroup direction="vertical">
                                    <ResizablePanel defaultSize={60}>
                                        <div className="h-full border-b border-white/10">
                                            <div className="h-8 bg-[#0a0a0a] border-b border-white/5 flex items-center px-4 justify-between">
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                                    <Code2 className="w-3 h-3" /> Source Code
                                                </div>
                                                <div className="text-[10px] text-orange-500/80 font-mono italic">
                                                    {activeFile}
                                                </div>
                                            </div>
                                            <SandpackCodeEditor
                                                showLineNumbers
                                                showTabs={false}
                                                style={{ height: 'calc(100% - 32px)' }}
                                            />
                                        </div>
                                    </ResizablePanel>

                                    <ResizableHandle className="h-1 bg-white/5 hover:bg-orange-500/20 transition-all" />

                                    <ResizablePanel defaultSize={40}>
                                        <div className="flex flex-col h-full bg-[#0d0d12]">
                                            {/* Stage Progress Bar */}
                                            <StageProgress currentStage={currentStage} />

                                            <div className="h-8 bg-[#0a0a0a] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                                                <Sparkles className="w-3 h-3 text-orange-500" />
                                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Vibe Engine</div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                {messages.map((msg, i) => {
                                                    // Detect if this is a Plan Artifact
                                                    const isPlan = msg.content.includes("## Stage");
                                                    return (
                                                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-orange-600 text-white shadow-orange-500/20 shadow-lg' : 'bg-white/10 text-gray-400'}`}>
                                                                {msg.role === 'ai' ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap">
                                                                        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
                                                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            {msg.role === 'ai' ? (
                                                                <div className="max-w-[90%] w-full">
                                                                    <ArtifactMessage
                                                                        content={msg.content}
                                                                        onApprove={() => {
                                                                            setChatInput("Approved");
                                                                            handleSendMessage();
                                                                        }}
                                                                    />
                                                                    {msg.imageUrl && (
                                                                        <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                                                                            <img src={msg.imageUrl} alt="Generated" className="w-full h-auto" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className={`p-3 rounded-xl text-xs max-w-[85%] border shadow-sm bg-orange-600/10 border-orange-600/20 text-orange-100 italic`}>
                                                                    {msg.content}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                                {isGenerating && (
                                                    <div className="flex gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-orange-500/20 shadow-lg animate-pulse">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap">
                                                                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                                                            </svg>
                                                        </div>
                                                        <ThinkingIndicator visible={true} action={thinkingAction} />
                                                    </div>
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>

                                            {/* Chat Input */}
                                            <div className="p-4 bg-[#0a0a0a] border-t border-white/10">
                                                <div className="bg-[#1a1a1a] rounded-xl flex items-center p-2 border border-white/10 focus-within:border-orange-500/50 transition-all shadow-inner gap-1">
                                                    <button
                                                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                                                        title="Attach"
                                                    >
                                                        <Paperclip className="w-4 h-4" />
                                                    </button>

                                                    <input
                                                        value={chatInput}
                                                        onChange={(e) => setChatInput(e.target.value)}
                                                        disabled={isGenerating}
                                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                                        className="flex-1 bg-transparent border-none outline-none text-xs px-2 placeholder-gray-600"
                                                        placeholder="Vibe something into existence..."
                                                    />

                                                    <button
                                                        onClick={handleVoiceInput}
                                                        className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-gray-500 hover:text-white'}`}
                                                    >
                                                        <AudioLines className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={handleSendMessage}
                                                        disabled={isGenerating || !chatInput}
                                                        className="p-2 bg-orange-600 rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50"
                                                    >
                                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </ResizablePanel>
                                </ResizablePanelGroup>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle className="bg-white/5 hover:bg-orange-500/20 transition-colors" />

                        {/* Right: Live Preview */}
                        <ResizablePanel defaultSize={40} minSize={30}>
                            <PreviewPanel
                                isBuilding={isGenerating}
                                isReady={false}
                                port={3000}
                                buildStatus={thinkingAction === 'building' ? 'Building your project...' : 'Thinking...'}
                            />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </div>
        </SandpackProvider>
    );
}

interface FileTreeItemProps {
    name: string;
    isFolder?: boolean;
    isOpen?: boolean;
    children?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
}

function FileTreeItem({ name, isFolder, isOpen, children, active, onClick }: FileTreeItemProps) {
    return (
        <div className="pl-2">
            <div
                onClick={onClick}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg cursor-pointer text-sm transition-all ${active ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20 font-medium' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
                {isFolder ? (
                    isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                ) : <FileCode className="w-3.5 h-3.5" />}
                <span className="truncate">{name}</span>
            </div>
            {isOpen && children && <div className="pl-2 border-l border-white/5 ml-2 mt-1">{children}</div>}
        </div>
    )
}
