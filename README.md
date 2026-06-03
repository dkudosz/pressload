# Pressload

A WordPress-parity CMS built on **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM**, and **NextAuth.js v5**.

> WordPress-style content management with a modern, self-hostable Node.js stack — no PHP required.

---

## Features

| Category | What's included |
|----------|----------------|
| **Content** | Posts, pages, revisions, draft/pending/private/publish statuses |
| **Editor** | TipTap block editor — headings, lists, quotes, code, images, tables, links |
| **Media** | Drag-drop uploads, image resizing (sharp), featured images, alt/caption editing |
| **Taxonomies** | Hierarchical categories + tags; archive pages; per-post assignment |
| **Users** | Role-based access (Administrator → Subscriber); profile management |
| **Comments** | Threaded (3 levels), moderation queue, email notifications |
| **Settings** | General, Reading, Discussion, Permalinks — all stored in `pl_options` |
| **Menus** | Database-backed nav menus; assign to theme locations (primary, footer, social) |
| **SEO** | Per-post meta title/description/canonical/OG/noindex; `generateMetadata`; sitemap; robots.txt |
| **Plugins** | Hook API (`addAction`/`addFilter`); scan-and-load from `plugins/`; built-in SEO plugin |
| **Themes** | Manifest-driven themes in `themes/`; built-in default theme |
| **REST API** | 13 endpoint groups; Bearer token + session auth; pagination, filtering, field selection |
| **Webhooks** | Register HMAC-signed webhooks; fires on post create/update/delete |
| **Security** | Rate-limited auth, security headers (CSP, HSTS, X-Frame-Options…) |
| **CI** | GitHub Actions: typecheck → lint → unit tests → build → E2E |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or any Postgres-compatible provider)

### 1. Clone & install

```bash
git clone https://github.com/your-org/pressload.git
cd pressload
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pressload
AUTH_SECRET=<generate with: openssl rand -base64 32>

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPLOADS_DIR=./uploads
RESEND_API_KEY=re_...
```

### 3. Run the dev server

```bash
npm run dev
```

### 4. Install via wizard

Visit **http://localhost:3000/install** and follow the 4-step wizard:
1. Test database connection
2. Create all tables
3. Enter site info + create admin account
4. Done — log in to your dashboard

---

## Project Structure

```
app/           Next.js App Router routes (admin + public site + API)
components/    React components (admin, editor, site, ui)
lib/           Core library (db, auth, actions, api, hooks, options, storage…)
plugins/       First-party plugins (pressload-seo)
themes/        First-party themes (pressload-default)
tests/         Unit tests (Vitest) + E2E tests (Playwright)
```

Full structure documented in `CLAUDE.md`.

---

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run start         # Start production server
npm run typecheck     # TypeScript type check (zero errors required)
npm run lint          # ESLint
npm run test          # All unit tests
npm run test:unit     # Vitest unit tests
npm run test:coverage # Unit tests with coverage report
npm run test:e2e      # Playwright E2E (needs running app + DB)
npm run db:generate   # Generate Drizzle migration from schema changes
npm run db:migrate    # Apply pending migrations to DB
npm run db:push       # Push schema directly (dev only)
npm run db:studio     # Open Drizzle Studio (visual DB browser)
```

---

## REST API

Base URL: `/api/v1/`

### Authentication

**Bearer token** (recommended for integrations):
```
Authorization: Bearer <your-api-key>
```
Generate your key at **Admin → Profile → API Key**.

**Session cookie** — works automatically for browser-based requests.

### Response envelope

```json
{ "data": { ... } }
{ "data": [...], "meta": { "total": 42, "page": 1, "per_page": 10, "total_pages": 5 } }
{ "error": "message" }
```

### Common query parameters

| Param | Default | Notes |
|-------|---------|-------|
| `page` | 1 | |
| `per_page` | 10 | Max 100 |
| `fields` | all | `?fields=id,title,slug` — sparse fieldsets |
| `sort` | date | |
| `order` | desc | `asc` or `desc` |
| `status` | publish | `draft`, `pending`, `private` require auth |
| `search` | — | Full-text on title/excerpt |

### Endpoints

```
GET    /api/v1/posts               List posts
GET    /api/v1/posts/{id|slug}     Single post
POST   /api/v1/posts               Create post           (auth)
PUT    /api/v1/posts/{id}          Update post           (auth)
DELETE /api/v1/posts/{id}          Trash / delete post   (auth)

GET    /api/v1/pages               List pages
GET    /api/v1/pages/{slug}        Single page

GET    /api/v1/media               List media
POST   /api/v1/media               Upload file           (auth, multipart)

GET    /api/v1/users               List users            (admin/editor)
GET    /api/v1/users/me            Current user          (auth)

GET    /api/v1/taxonomies          All terms
GET    /api/v1/taxonomies/{type}   Terms by type (category | post_tag)

GET    /api/v1/settings            Public site settings

GET    /api/v1/menus/{location}    Menu by location

GET    /api/v1/webhooks            List webhooks         (auth)
POST   /api/v1/webhooks            Register webhook      (auth)
DELETE /api/v1/webhooks/{id}       Remove webhook        (auth)
```

---

## Writing a Plugin

See [CONTRIBUTING.md](CONTRIBUTING.md#writing-a-plugin) for the full guide.

Quick example:

```typescript
// plugins/my-plugin/index.ts
import type { HookSystem } from '@/lib/hooks'

export function register(hooks: HookSystem) {
  hooks.addFilter('pressload.post.json_ld', (schemas, ctx) => {
    return [...(schemas as object[]), { '@type': 'MyCustomSchema' }]
  })
}
```

Create `pressload.plugin.json` alongside it, then activate via **Admin → Plugins**.

---

## Writing a Theme

Add a `pressload.theme.json` to `themes/<name>/` and activate via **Admin → Themes**.

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "description": "My theme.",
  "locations": ["primary", "footer"],
  "supports": ["featured-image", "custom-logo"]
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | — | NextAuth secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | — | `http://localhost:3000` | Public URL |
| `UPLOADS_DIR` | — | `./uploads` | Upload directory path |
| `RESEND_API_KEY` | — | — | Email via Resend (comment notifications) |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## License

ISC
