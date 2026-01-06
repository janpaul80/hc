/**
 * HashCoder IDE - Vercel Integration
 * 
 * Handles deployment to Vercel
 */

export interface VercelDeployment {
    id: string;
    url: string;
    readyState: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED';
    alias: string[];
}

export interface VercelProject {
    id: string;
    name: string;
    framework: string | null;
}

export class VercelService {
    private token: string;
    private apiBase = 'https://api.vercel.com';

    constructor(token: string) {
        this.token = token;
    }

    /**
     * Create a new Vercel project
     */
    async createProject(name: string, gitUrl: string): Promise<VercelProject> {
        const response = await fetch(`${this.apiBase}/v9/projects`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                gitRepository: {
                    repo: gitUrl,
                    type: 'github'
                },
                framework: null // Auto-detect
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create Vercel project: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        return {
            id: data.id,
            name: data.name,
            framework: data.framework
        };
    }

    /**
     * Deploy a project to Vercel
     */
    async deploy(
        projectName: string,
        files: Record<string, string>,
        envVars?: Record<string, string>
    ): Promise<VercelDeployment> {
        // Prepare files for deployment
        const filesList = Object.entries(files).map(([file, content]) => ({
            file,
            data: Buffer.from(content).toString('base64'),
            encoding: 'base64'
        }));

        const response = await fetch(`${this.apiBase}/v13/deployments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: projectName,
                files: filesList,
                projectSettings: {
                    framework: null // Auto-detect
                },
                target: 'production',
                env: envVars || {}
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Deployment failed: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        return {
            id: data.id,
            url: `https://${data.url}`,
            readyState: data.readyState,
            alias: data.alias || []
        };
    }

    /**
     * Get deployment status
     */
    async getDeploymentStatus(deploymentId: string): Promise<VercelDeployment> {
        const response = await fetch(`${this.apiBase}/v13/deployments/${deploymentId}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get deployment status');
        }

        const data = await response.json();

        return {
            id: data.id,
            url: `https://${data.url}`,
            readyState: data.readyState,
            alias: data.alias || []
        };
    }

    /**
     * Set environment variables for a project
     */
    async setEnvVariables(
        projectId: string,
        envVars: Record<string, string>
    ): Promise<void> {
        const promises = Object.entries(envVars).map(([key, value]) =>
            fetch(`${this.apiBase}/v9/projects/${projectId}/env`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key,
                    value,
                    type: 'encrypted',
                    target: ['production', 'preview', 'development']
                })
            })
        );

        await Promise.all(promises);
    }

    /**
     * Get project by name
     */
    async getProject(name: string): Promise<VercelProject | null> {
        const response = await fetch(`${this.apiBase}/v9/projects/${name}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error('Failed to get project');
        }

        const data = await response.json();

        return {
            id: data.id,
            name: data.name,
            framework: data.framework
        };
    }
}
