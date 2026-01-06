/**
 * HashCoder IDE - Deploy to GitHub API
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/deployment/github';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { repoName, files, isPrivate } = await req.json();

        if (!repoName || !files) {
            return NextResponse.json(
                { error: 'Missing repoName or files' },
                { status: 400 }
            );
        }

        // Get GitHub token from user settings (stored in DB or env)
        const githubToken = process.env.GITHUB_TOKEN;

        if (!githubToken) {
            return NextResponse.json(
                { error: 'GitHub token not configured' },
                { status: 500 }
            );
        }

        const github = new GitHubService(githubToken);

        // Create repository
        const repo = await github.createRepository(repoName, isPrivate || false);

        // Extract owner from HTML URL
        const owner = repo.htmlUrl.split('/')[3];

        // Push files
        const commit = await github.pushFiles(owner, repo.name, files);

        return NextResponse.json({
            success: true,
            repo: {
                name: repo.name,
                url: repo.htmlUrl,
                cloneUrl: repo.cloneUrl
            },
            commit: {
                sha: commit.sha,
                message: commit.message,
                url: commit.url
            }
        });

    } catch (error: any) {
        console.error('[GitHub Deploy] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
