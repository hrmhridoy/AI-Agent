# Deployment Guide — ProductPilot AI on Vercel

## Overview

ProductPilot AI is designed for deployment on Vercel with Supabase as the backend infrastructure.

## Step 1: Supabase Setup

### Database

1. Go to **Project Settings → Database**
2. Copy connection strings:
   - **Transaction pooler** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

### Authentication

1. Go to **Authentication → URL Configuration**
2. Set Site URL to your Vercel domain (e.g., `https://productpilot.vercel.app`)
3. Add redirect URLs:
   - `https://your-domain.vercel.app/**`
   - `http://localhost:3000/**` (for local dev)

### Storage

1. Go to **Storage → New bucket**
2. Name: `product-images`
3. Set as **Public bucket**
4. Add policy for authenticated uploads:

```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

### Service Role Key

Copy from **Project Settings → API** → `SUPABASE_SERVICE_ROLE_KEY`

> Keep this secret — only use server-side.

## Step 2: Push Database Schema

```bash
npx prisma db push
```

For production migrations, use:

```bash
npx prisma migrate deploy
```

## Step 3: Deploy to Vercel

### Via Git

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Set root directory to `productpilot-ai`
4. Framework preset: **Next.js**

### Environment Variables

Add all variables from `.env.example`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) |
| `DATABASE_URL` | Pooled PostgreSQL URL |
| `DIRECT_URL` | Direct PostgreSQL URL |
| `ENCRYPTION_KEY` | 64-char hex string |
| `RATE_LIMIT_MAX_REQUESTS` | Default: 100 |
| `RATE_LIMIT_WINDOW_MS` | Default: 60000 |
| `SUPABASE_STORAGE_BUCKET` | `product-images` |
| `CRON_SECRET` | Random secret for cron auth |

### Build Settings

- **Build Command:** `prisma generate && next build`
- **Install Command:** `npm install && npx playwright install chromium`

> Playwright on Vercel: Add `PLAYWRIGHT_BROWSERS_PATH=0` if needed. For serverless, consider using `@sparticuz/chromium` for production scraping — the current setup uses standard Playwright which works on Vercel with proper install step.

## Step 4: Configure Cron Job

`vercel.json` includes a cron job for scheduled publishing every 5 minutes.

Set `CRON_SECRET` in Vercel env vars. Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>`.

## Step 5: Post-Deploy Checklist

- [ ] Register first user account
- [ ] Promote to admin via SQL: `UPDATE users SET role = 'ADMIN' WHERE email = '...'`
- [ ] Configure AI API in Settings
- [ ] Configure WooCommerce credentials
- [ ] Test single product import
- [ ] Test WooCommerce publish
- [ ] Verify image storage in Supabase bucket
- [ ] Check `/api-docs` for API reference

## WooCommerce Setup

1. Go to **WooCommerce → Settings → Advanced → REST API**
2. Click **Add key**
3. Permissions: **Read/Write**
4. Copy Consumer Key and Consumer Secret to ProductPilot settings

## AI API Setup

Supports any OpenAI-compatible endpoint:

| Provider | Base URL |
|----------|----------|
| OpenAI | `https://api.openai.com/v1` |
| Azure OpenAI | Your deployment URL |
| Local (Ollama) | `http://localhost:11434/v1` |
| Groq | `https://api.groq.com/openai/v1` |

## Troubleshooting

### Playwright fails on Vercel

Install browsers during build:
```
npm install && npx playwright install chromium --with-deps
```

### Database connection errors

Ensure `DATABASE_URL` uses the **pooler** connection (port 6543 with pgbouncer) and `DIRECT_URL` uses direct connection (port 5432).

### Images not uploading

Verify the `product-images` bucket exists and is public. Check `SUPABASE_SERVICE_ROLE_KEY` is set.

### SSE not updating import queue

SSE works on Vercel but has a 5-minute timeout. The import form also polls via GET `/api/import` on mount.

## Scaling Notes

- Import queue processes sequentially per user — for high volume, consider adding a background job service (Inngest, Trigger.dev, or BullMQ with Redis)
- Rate limiting uses in-memory store — for multi-instance deployments, use Redis-based rate limiting
- Playwright scraping is CPU-intensive — consider dedicated worker for production scale
