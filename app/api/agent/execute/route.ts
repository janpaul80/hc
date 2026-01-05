/**
 * HashCoder IDE - Action Execution API
 * 
 * Executes agent actions and streams results back to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActionExecutor } from '@/lib/agent/executor';
import { AgentAction } from '@/lib/agent/actions';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { action, projectId } = await req.json() as {
            action: AgentAction;
            projectId: string;
        };

        if (!action || !projectId) {
            return NextResponse.json(
                { error: 'Missing action or projectId' },
                { status: 400 }
            );
        }

        // Create workspace directory for this project
        const workspaceRoot = path.join(os.tmpdir(), 'hashcoder-workspaces', projectId);

        // Initialize executor
        const executor = new ActionExecutor(workspaceRoot);

        // Execute action
        const result = await executor.execute(action);

        return NextResponse.json({
            success: true,
            result
        });

    } catch (error: any) {
        console.error('[ActionExecute] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
