# ProductPilot AI

A production-ready SaaS application for importing products from external websites, optimizing content with AI, and publishing as WooCommerce External/Affiliate products.

## Features

- **Product Import** — Single URL, bulk URL, and CSV import with Playwright + Cheerio extraction
- **AI Content Generation** — OpenAI-compatible API for SEO titles, descriptions, tags, and categories
- **WooCommerce Integration** — Publish external/affiliate products via REST API
- **Product Editor** — Rich text editor, image gallery, tags, specifications, SEO preview
- **Bulk Import Queue** — Sequential processing with live SSE updates
- **Blog Generator** — 1500+ word AI articles with FAQ, pros/cons
- **SEO System** — Meta tags, OpenGraph, Twitter Cards, JSON-LD schema
- **Admin Dashboard** — User management, settings, activity logs
- **Bonus Features** — Duplicate detection, product comparison, scheduled publishing, auto-retry, CSV export/import

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Shadcn UI |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase PostgreSQL + Prisma ORM |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Scraping | Playwright, Cheerio |
| AI | OpenAI-compatible endpoints |
| CMS | WooCommerce REST API |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- WooCommerce store (for publishing)
- OpenAI-compatible AI API key

### 1. Clone and install

```bash
cd productpilot-ai
npm install
npx playwright install chromium
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set up Supabase

1. Create a new Supabase project
2. Copy the project URL and anon key to `.env.local`
3. Copy the database connection strings (use pooler URL for `DATABASE_URL`)
4. Create a storage bucket named `product-images` (public)
5. Enable Email auth in Authentication settings

### 4. Initialize database

```bash
npx prisma db push
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Create admin user

1. Register a new account
2. In Supabase SQL editor or Prisma Studio, update the user role:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

## Project Structure

```
productpilot-ai/
├── prisma/schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, register, forgot password
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # REST API routes
│   ├── actions/               # Server Actions
│   ├── components/            # UI components
│   ├── lib/
│   │   ├── services/          # Business logic (extractor, AI, WooCommerce)
│   │   ├── supabase/          # Supabase clients
│   │   └── validations/       # Zod schemas
│   └── types/                 # TypeScript types
├── .env.example
├── DEPLOYMENT.md
└── vercel.json                # Cron for scheduled publishing
```

## API Documentation

Interactive API docs available at `/api-docs` when logged in.

OpenAPI spec: `GET /api/openapi`

## User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Settings, AI/WooCommerce config, user management, logs, all product operations |
| **User** | Import, edit, publish own products |

## Security

- API keys and WooCommerce credentials encrypted with AES-256-GCM
- Rate limiting on API routes
- Zod input validation on all endpoints
- Supabase session-based auth with middleware protection
- CSRF protection via SameSite cookies (Supabase SSR)

## License

MIT
