"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface CommandOutput {
    type: 'stdout' | 'stderr';
    data: string;
    projectId: string;
}

interface CommandComplete {
    exitCode: number;
    projectId: string;
}

interface UseTerminalSocketProps {
    projectId: string;
    onOutput?: (output: CommandOutput) => void;
    onComplete?: (result: CommandComplete) => void;
    onError?: (error: string) => void;
}

export function useTerminalSocket({
    projectId,
    onOutput,
    onComplete,
    onError
}: UseTerminalSocketProps) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize socket connection
        const socket = io({
            path: '/api/socket',
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            console.log('[Terminal Socket] Connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('[Terminal Socket] Disconnected');
            setIsConnected(false);
        });

        // Command output events
        socket.on('command-output', (data: CommandOutput) => {
            if (data.projectId === projectId) {
                onOutput?.(data);
            }
        });

        socket.on('command-complete', (data: CommandComplete) => {
            if (data.projectId === projectId) {
                onComplete?.(data);
            }
        });

        socket.on('command-error', (data: { error: string; projectId: string }) => {
            if (data.projectId === projectId) {
                onError?.(data.error);
            }
        });

        // Cleanup
        return () => {
            socket.disconnect();
        };
    }, [projectId, onOutput, onComplete, onError]);

    const executeCommand = (command: string, cwd: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('execute-command', {
                command,
                cwd,
                projectId
            });
        } else {
            console.error('[Terminal Socket] Not connected');
        }
    };

    return {
        isConnected,
        executeCommand
    };
}
