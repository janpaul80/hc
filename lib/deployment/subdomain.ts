/**
 * HashCoder IDE - Subdomain Publishing Service
 * 
 * Publishes user apps to app.{userId}.nextcoder.icu
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

export interface SubdomainDeployment {
    subdomain: string;
    fullUrl: string;
    userId: string;
    projectId: string;
    port: number;
    status: 'building' | 'running' | 'error';
}

export class SubdomainService {
    private baseDomain = 'nextcoder.icu';
    private deploymentDir = '/var/www/deployments'; // Server path
    private portRange = { min: 3100, max: 3999 }; // Port range for apps

    /**
     * Deploy project to subdomain
     */
    async deploy(
        userId: string,
        projectId: string,
        files: Record<string, string>,
        projectName: string
    ): Promise<SubdomainDeployment> {
        // Generate subdomain
        const subdomain = `app.${userId}`;
        const fullUrl = `https://${subdomain}.${this.baseDomain}`;

        // Allocate port
        const port = await this.allocatePort(userId);

        // Create deployment directory
        const deployPath = path.join(this.deploymentDir, userId, projectId);
        await fs.mkdir(deployPath, { recursive: true });

        // Write files
        await this.writeFiles(deployPath, files);

        // Install dependencies and build
        await this.buildProject(deployPath);

        // Start the app on allocated port
        await this.startApp(deployPath, port);

        // Configure reverse proxy (Nginx/Caddy)
        await this.configureProxy(subdomain, port);

        // Store deployment info in database
        await this.saveDeployment({
            subdomain,
            fullUrl,
            userId,
            projectId,
            port,
            status: 'running'
        });

        return {
            subdomain,
            fullUrl,
            userId,
            projectId,
            port,
            status: 'running'
        };
    }

    /**
     * Allocate a unique port for user
     */
    private async allocatePort(userId: string): Promise<number> {
        // In production, this would check DB for existing port or assign new one
        // For now, simple hash-based allocation
        const hash = this.hashString(userId);
        return this.portRange.min + (hash % (this.portRange.max - this.portRange.min));
    }

    /**
     * Write project files to disk
     */
    private async writeFiles(deployPath: string, files: Record<string, string>) {
        for (const [filePath, content] of Object.entries(files)) {
            const fullPath = path.join(deployPath, filePath);
            const dir = path.dirname(fullPath);

            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
        }
    }

    /**
     * Build the project (npm install + build)
     */
    private async buildProject(deployPath: string): Promise<void> {
        // Check if package.json exists
        try {
            await fs.access(path.join(deployPath, 'package.json'));
        } catch {
            throw new Error('No package.json found');
        }

        // Install dependencies
        await this.runCommand('npm install', deployPath);

        // Build if build script exists
        const packageJson = JSON.parse(
            await fs.readFile(path.join(deployPath, 'package.json'), 'utf-8')
        );

        if (packageJson.scripts?.build) {
            await this.runCommand('npm run build', deployPath);
        }
    }

    /**
     * Start the Next.js/React app
     */
    private async startApp(deployPath: string, port: number): Promise<void> {
        // Use PM2 or similar process manager
        // For now, simple spawn
        const env = { ...process.env, PORT: port.toString() };

        const child = spawn('npm', ['start'], {
            cwd: deployPath,
            env,
            detached: true,
            stdio: 'ignore'
        });

        child.unref(); // Allow process to run independently
    }

    /**
     * Configure reverse proxy (Nginx/Caddy/Cloudflare)
     */
    private async configureProxy(subdomain: string, port: number): Promise<void> {
        // This would configure your reverse proxy
        // Example for Nginx:
        const nginxConfig = `
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${subdomain}.${this.baseDomain};

    ssl_certificate /etc/letsencrypt/live/${this.baseDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${this.baseDomain}/privkey.pem;

    location / {
        proxy_pass http://localhost:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

        // In production, you would:
        // 1. Write nginx config to /etc/nginx/sites-available/${subdomain}
        // 2. Create symlink to sites-enabled
        // 3. Reload nginx: sudo nginx -s reload

        // For Coolify/Cloudflare, use their API
        console.log('[Proxy] Config generated for', subdomain);
    }

    /**
     * Save deployment to database
     */
    private async saveDeployment(deployment: SubdomainDeployment): Promise<void> {
        // Store in Supabase
        // const { error } = await supabase
        //   .from('deployments')
        //   .upsert({
        //     user_id: deployment.userId,
        //     project_id: deployment.projectId,
        //     subdomain: deployment.subdomain,
        //     port: deployment.port,
        //     status: deployment.status
        //   });

        console.log('[DB] Deployment saved:', deployment);
    }

    /**
     * Run shell command
     */
    private runCommand(command: string, cwd: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, {
                cwd,
                shell: true,
                stdio: 'pipe'
            });

            let stderr = '';

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed: ${stderr}`));
                }
            });
        });
    }

    /**
     * Simple hash function for port allocation
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    /**
     * Stop a deployment
     */
    async stop(userId: string, projectId: string): Promise<void> {
        // Stop PM2 process or kill process on port
        // Remove nginx config
        // Update DB status
        console.log('[Deploy] Stopping', userId, projectId);
    }

    /**
     * Get deployment status
     */
    async getStatus(userId: string, projectId: string): Promise<SubdomainDeployment | null> {
        // Query from database
        return null;
    }
}
