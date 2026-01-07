"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileJson, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
    name: string;
    type: 'file' | 'folder';
    path: string;
    isOpen?: boolean;
    children?: FileItem[];
}

interface TreeItemProps {
    item: FileItem;
    depth?: number;
    selectedFile: string;
    onSelectFile: (path: string) => void;
}

const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'tsx':
        case 'jsx':
        case 'ts':
        case 'js':
            return <FileCode className="w-4 h-4 text-blue-400" />;
        case 'json':
            return <FileJson className="w-4 h-4 text-yellow-400" />;
        case 'css':
        case 'scss':
            return <FileText className="w-4 h-4 text-pink-400" />;
        case 'html':
            return <FileText className="w-4 h-4 text-orange-400" />;
        default:
            return <File className="w-4 h-4 text-zinc-500" />;
    }
};

function TreeItem({ item, depth = 0, selectedFile, onSelectFile }: TreeItemProps) {
    const [isOpen, setIsOpen] = useState(item.isOpen || false);
    const isFolder = item.type === 'folder';
    const isSelected = selectedFile === item.path;

    return (
        <div>
            <button
                onClick={() => {
                    if (isFolder) {
                        setIsOpen(!isOpen);
                    } else {
                        onSelectFile(item.path);
                    }
                }}
                className={cn(
                    "w-full flex items-center gap-1.5 px-2 py-1 text-left text-xs transition-colors rounded-md group overflow-hidden",
                    isSelected
                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {isFolder ? (
                    <>
                        {isOpen ? (
                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-zinc-500" />
                        )}
                        {isOpen ? (
                            <FolderOpen className="w-3.5 h-3.5 text-amber-500/80" />
                        ) : (
                            <Folder className="w-3.5 h-3.5 text-amber-500/80" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="w-3" />
                        {getFileIcon(item.name)}
                    </>
                )}
                <span className="truncate">{item.name}</span>
            </button>
            {isFolder && isOpen && item.children && (
                <div className="mt-0.5">
                    {item.children.map((child, i) => (
                        <TreeItem
                            key={child.path || i}
                            item={child}
                            depth={depth + 1}
                            selectedFile={selectedFile}
                            onSelectFile={onSelectFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FileTree({
    files,
    selectedFile,
    onSelectFile
}: {
    files: any[],
    selectedFile: string,
    onSelectFile: (path: string) => void
}) {
    // Convert flat path object to hierarchy if needed, but for now we assume nested structure
    // provided by the caller or use the flat logic if it's easier.
    // The provided sampleFiles was already nested.

    return (
        <div className="py-2 px-1">
            {files.map((item, i) => (
                <TreeItem
                    key={item.path || i}
                    item={item}
                    selectedFile={selectedFile}
                    onSelectFile={onSelectFile}
                />
            ))}
        </div>
    );
}
