/**
 * HashCoder IDE - WebSocket Terminal Streaming
 * 
 * Provides real-time streaming of command output from server to client
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { spawn, ChildProcess } from 'child_process';

let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HTTPServer) {
    if (io) {
        console.log('[SocketIO] Already initialized');
        return io;
    }

    io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('[SocketIO] Client connected:', socket.id);

        // Handle command execution with streaming
        socket.on('execute-command', async (data: {
            command: string;
            cwd: string;
            projectId: string;
        }) => {
            console.log('[SocketIO] Executing command:', data.command);

            const { command, cwd, projectId } = data;

            // Spawn process
            const child: ChildProcess = spawn(command, {
                cwd,
                shell: true,
                env: process.env
            });

            // Stream stdout
            child.stdout?.on('data', (chunk) => {
                const output = chunk.toString();
                socket.emit('command-output', {
                    type: 'stdout',
                    data: output,
                    projectId
                });
            });

            // Stream stderr
            child.stderr?.on('data', (chunk) => {
                const output = chunk.toString();
                socket.emit('command-output', {
                    type: 'stderr',
                    data: output,
                    projectId
                });
            });

            // Process completion
            child.on('close', (code) => {
                socket.emit('command-complete', {
                    exitCode: code,
                    projectId
                });
            });

            // Process error
            child.on('error', (error) => {
                socket.emit('command-error', {
                    error: error.message,
                    projectId
                });
            });
        });

        socket.on('disconnect', () => {
            console.log('[SocketIO] Client disconnected:', socket.id);
        });
    });

    console.log('[SocketIO] Initialized successfully');
    return io;
}

export function getIO(): SocketIOServer | null {
    return io;
}
