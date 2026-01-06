/**
 * HashCoder IDE - Publish to Subdomain API
 * 
 * Deploys project to app.{userId}.nextcoder.icu
 */

import { NextRequest, NextResponse } from 'next/server';
import { SubdomainService } from '@/lib/deployment/subdomain';
import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId, projectName } = await req.json();

        if (!projectId) {
            return NextResponse.json(
                { error: 'Missing projectId' },
                { status: 400 }
            );
        }

        // Get project files from database
        const supabase = createServiceClient();
        const { data: project, error } = await supabase
            .from('projects')
            .select('files, name')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Deploy to subdomain
        const subdomainService = new SubdomainService();
        const deployment = await subdomainService.deploy(
            userId,
            projectId,
            project.files,
            projectName || project.name
        );

        // Update project with subdomain
        await supabase
            .from('projects')
            .update({
                subdomain: deployment.subdomain,
                published_url: deployment.fullUrl,
                last_deployed: new Date().toISOString()
            })
            .eq('id', projectId);

        return NextResponse.json({
            success: true,
            deployment: {
                subdomain: deployment.subdomain,
                url: deployment.fullUrl,
                status: deployment.status,
                port: deployment.port
            }
        });

    } catch (error: any) {
        console.error('[Subdomain Publish] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Get deployment status
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = req.nextUrl.searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json(
                { error: 'Missing projectId' },
                { status: 400 }
            );
        }

        const subdomainService = new SubdomainService();
        const status = await subdomainService.getStatus(userId, projectId);

        if (!status) {
            return NextResponse.json(
                { error: 'Deployment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ deployment: status });

    } catch (error: any) {
        console.error('[Subdomain Status] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Stop/unpublish deployment
 */
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json(
                { error: 'Missing projectId' },
                { status: 400 }
            );
        }

        const subdomainService = new SubdomainService();
        await subdomainService.stop(userId, projectId);

        // Update database
        const supabase = createServiceClient();
        await supabase
            .from('projects')
            .update({
                subdomain: null,
                published_url: null
            })
            .eq('id', projectId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Subdomain Stop] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
