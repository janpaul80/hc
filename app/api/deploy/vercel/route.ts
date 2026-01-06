/**
 * HashCoder IDE - Deploy to Vercel API
 */

import { NextRequest, NextResponse } from 'next/server';
import { VercelService } from '@/lib/deployment/vercel';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectName, files, envVars, gitUrl } = await req.json();

        if (!projectName || !files) {
            return NextResponse.json(
                { error: 'Missing projectName or files' },
                { status: 400 }
            );
        }

        // Get Vercel token from user settings (stored in DB or env)
        const vercelToken = process.env.VERCEL_TOKEN;

        if (!vercelToken) {
            return NextResponse.json(
                { error: 'Vercel token not configured' },
                { status: 500 }
            );
        }

        const vercel = new VercelService(vercelToken);

        // Check if project exists
        let project = await vercel.getProject(projectName);

        // Create project if it doesn't exist and gitUrl is provided
        if (!project && gitUrl) {
            project = await vercel.createProject(projectName, gitUrl);
        }

        // Deploy
        const deployment = await vercel.deploy(projectName, files, envVars);

        // Set environment variables if provided
        if (project && envVars && Object.keys(envVars).length > 0) {
            await vercel.setEnvVariables(project.id, envVars);
        }

        return NextResponse.json({
            success: true,
            deployment: {
                id: deployment.id,
                url: deployment.url,
                readyState: deployment.readyState
            },
            project: project ? {
                id: project.id,
                name: project.name
            } : null
        });

    } catch (error: any) {
        console.error('[Vercel Deploy] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
