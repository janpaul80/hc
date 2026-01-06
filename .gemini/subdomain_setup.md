# Subdomain Publishing Setup Guide

## Overview

HashCoder IDE allows users to publish their apps to:
```
https://app.{userId}.nextcoder.icu
```

## Architecture

```
User → Deploy API → SubdomainService → Build → Start App → Reverse Proxy → Live URL
```

---

## Setup Steps

### 1. DNS Configuration (Cloudflare)

**Add wildcard DNS record:**

```
Type: CNAME
Name: *.nextcoder.icu
Target: your-server-ip or coolify-domain
Proxy: ON (orange cloud)
```

This makes `app.*.nextcoder.icu` point to your server.

### 2. SSL Certificate (Let's Encrypt)

**Get wildcard SSL:**

```bash
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  --server https://acme-v02.api.letsencrypt.org/directory \
  -d *.nextcoder.icu \
  -d nextcoder.icu
```

Follow instructions to add DNS TXT record.

### 3. Reverse Proxy (Nginx/Caddy)

**Option A: Nginx**

Create `/etc/nginx/sites-available/wildcard-subdomain`:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name ~^app\.(?<userid>[^.]+)\.nextcoder\.icu$;

    ssl_certificate /etc/letsencrypt/live/nextcoder.icu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nextcoder.icu/privkey.pem;

    location / {
        # Proxy to user's app port (stored in DB)
        # This is a simplified example
        # In production, use dynamic lookup
        proxy_pass http://localhost:$port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option B: Cloudflare Workers** (Recommended for Coolify)

Use Cloudflare Workers to route subdomains to specific ports:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const subdomain = url.hostname.split('.')[0]
  
  if (subdomain.startsWith('app-')) {
    const userId = subdomain.replace('app-', '')
    
    // Lookup port from your API
    const port = await getUserPort(userId)
    
    // Proxy request
    return fetch(`http://your-server:${port}${url.pathname}`)
  }
  
  return fetch(request)
}
```

### 4. Database Migration

Run the SQL migration:

```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/add_deployments_table.sql
```

### 5. Environment Variables

Add to `.env`:

```bash
DEPLOYMENT_DIR=/var/www/deployments
PORT_RANGE_MIN=3100
PORT_RANGE_MAX=3999
SUBDOMAIN_BASE_DOMAIN=nextcoder.icu
```

### 6. Process Manager (PM2)

Install PM2 globally:

```bash
npm install -g pm2
```

Apps will be managed with PM2 for auto-restart and monitoring.

---

## API Usage

### Deploy to Subdomain

```typescript
POST /api/deploy/subdomain

Body:
{
  "projectId": "uuid",
  "projectName": "my-app"
}

Response:
{
  "success": true,
  "deployment": {
    "subdomain": "app.user_123",
    "url": "https://app.user_123.nextcoder.icu",
    "status": "running",
    "port": 3150
  }
}
```

### Get Deployment Status

```typescript
GET /api/deploy/subdomain?projectId=uuid

Response:
{
  "deployment": {
    "subdomain": "app.user_123",
    "url": "https://app.user_123.nextcoder.icu",
    "status": "running"
  }
}
```

### Unpublish

```typescript
DELETE /api/deploy/subdomain

Body:
{
  "projectId": "uuid"
}

Response:
{
  "success": true
}
```

---

## Port Allocation

Each user gets a deterministic port based on their userId:

```
Port = 3100 + (hash(userId) % 900)
```

Range: 3100-3999 (900 concurrent apps supported)

---

## Frontend Integration

Wire up the "Publish Subdomain" button:

```typescript
const handlePublishSubdomain = async () => {
  const response = await fetch('/api/deploy/subdomain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: params.id,
      projectName: project.name
    })
  });

  const data = await response.json();
  
  if (data.success) {
    alert(`Published to: ${data.deployment.url}`);
    window.open(data.deployment.url, '_blank');
  }
};
```

---

## Monitoring

Check deployment logs:

```bash
# List all PM2 processes
pm2 list

# View logs for specific app
pm2 logs app-{userId}-{projectId}

# Monitor resources
pm2 monit
```

---

## Security Considerations

1. **Rate Limiting:** Limit deployments per user (5/day)
2. **Resource Limits:** Cap CPU/memory per app
3. **Sandboxing:** Use Docker containers for isolation
4. **HTTPS Only:** Force SSL for all subdomains
5. **Authentication:** Verify project ownership before deploy

---

## Troubleshooting

**Issue:** Subdomain not resolving  
**Fix:** Check Cloudflare DNS propagation (can take 5min)

**Issue:** SSL certificate error  
**Fix:** Verify wildcard cert covers `*.nextcoder.icu`

**Issue:** Port already in use  
**Fix:** Check PM2 process list, restart if needed

---

## Next Steps

1. Run DB migration in Supabase
2. Configure wildcard DNS in Cloudflare
3. Set up reverse proxy (Nginx/Workers)
4. Test with a sample deployment
5. Wire frontend button to API

**Status:** Backend ready, infrastructure setup required!
