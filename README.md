# Pressload

> WordPress-parity CMS on a modern Node.js stack — no PHP required.

Built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM**, and **NextAuth.js v5**. Pressload gives developers the familiar WordPress content model (posts, pages, taxonomies, menus, plugins, themes, REST API, webhooks) without the legacy PHP codebase.

---

## Features

| Category | What's included |
|----------|----------------|
| **Content** | Posts, pages, revisions, draft / pending / private / publish statuses |
| **Editor** | TipTap rich block editor — headings, lists, blockquotes, code, images, tables, links |
| **Media** | Drag-and-drop uploads, image resizing via `sharp`, featured images, alt/caption editing |
| **Taxonomies** | Hierarchical categories + flat tags; archive pages; per-post assignment |
| **Users** | Five roles (Administrator → Subscriber); profile management; bcrypt passwords |
| **Comments** | Threaded (3 levels), moderation queue, bulk actions, optional email notifications |
| **Settings** | General, Reading, Discussion, Permalinks — all stored in `pl_options` |
| **Menus** | Database-backed nav menus; assign to theme locations (primary, footer, social) |
| **SEO** | Per-post meta title / description / canonical / OG image / noindex; `generateMetadata`; XML sitemap; robots.txt |
| **Plugins** | WordPress-style hook API (`addAction` / `addFilter`); scan-and-load from `plugins/`; built-in SEO plugin |
| **Themes** | Manifest-driven themes in `themes/`; built-in default theme; location + supports system |
| **REST API** | 13 endpoint groups; Bearer token + session cookie auth; pagination, filtering, sparse fieldsets |
| **Webhooks** | Register HMAC-signed webhooks; fires on post create / update / delete |
| **Security** | Rate-limited auth, security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) |
| **Install wizard** | Browser-based 1-step setup after running `npm run setup` |
| **CI** | GitHub Actions: typecheck → lint → unit tests → build → E2E (Playwright) |

---

## Quick Start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+** — local or remote. On macOS and Linux the setup script can install and configure it for you. On Windows, have your PostgreSQL connection details ready.

### 1. Clone and install

```bash
git clone https://github.com/your-org/pressload.git
cd pressload
npm install
```

### 2. Run the setup script

```bash
npm run setup
```

The interactive script will:

- Ask for your PostgreSQL connection details (host, port, database name, user, password)
- On macOS/Linux: optionally create the database and user automatically (requires `psql` or will install PostgreSQL via Homebrew/apt)
- Write `.env.local` with `DATABASE_URL`, a generated `AUTH_SECRET`, and your site URL
- Run all database migrations
- Attempt to open `http://localhost:3000/install` in your browser when done

### 3. Start the dev server

```bash
npm run dev
```

### 4. Finish in the browser

Visit **http://localhost:3000/install** — because the setup script already handled the database, you'll land directly on the site-title and admin-account form. Fill it in and you're done.

---

### Manual / advanced setup

If you prefer full control, create `.env.local` yourself:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/pressload
AUTH_SECRET=<run: openssl rand -base64 32>

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPLOADS_DIR=./uploads
RESEND_API_KEY=re_...
```

Then:

```bash
npm run db:migrate   # create all tables
npm run dev          # start the server
```

Open **http://localhost:3000/install** — the installer detects your database automatically and skips straight to site setup.

---

## Scripts

```bash
npm run setup         # Interactive first-time installer (DB + .env.local + migrations)
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build
npm run start         # Start production server
npm run typecheck     # TypeScript strict check — zero errors required
npm run lint          # ESLint
npm run test          # All unit tests (Vitest)
npm run test:unit     # Vitest unit tests only
npm run test:coverage # Unit tests with coverage report
npm run test:e2e      # Playwright E2E (requires running app + DB)
npm run db:generate   # Generate Drizzle migration from schema changes
npm run db:migrate    # Apply pending migrations to DB
npm run db:push       # Push schema directly (dev only — no migration file)
npm run db:studio     # Drizzle Studio — visual database browser
```

---

## Project Structure

```
app/
  (site)/                   Public-facing site
    layout.tsx              SiteHeader (dynamic primary menu + site name)
    page.tsx                Homepage (posts feed or static front page)
    blog/
      page.tsx              Blog archive with pagination
      [slug]/page.tsx       Single post — taxonomy links, comments, JSON-LD
      category/[slug]/      Category archive
      tag/[slug]/           Tag archive
    [slug]/page.tsx         Static pages
    about/page.tsx
  (admin)/
    layout.tsx              Admin shell
    signin/page.tsx
    (protected)/            All auth-guarded admin pages
      layout.tsx
      dashboard/page.tsx
      posts/                List, new, [id] edit (PostForm + TipTap + SEO + categories + tags)
      pages/                List, new, [id] edit
      media/page.tsx        Media library (upload, grid, metadata editor)
      comments/page.tsx     Moderation queue (filter tabs, bulk actions)
      users/                List, new, [id] edit
      profile/page.tsx      Own profile + API key management
      plugins/page.tsx      Plugin list with activate / deactivate
      themes/page.tsx       Theme grid with activate
      settings/
        page.tsx            General (title, tagline, URL, email, timezone)
        reading/            Posts per page, homepage display mode
        discussion/         Comments, moderation, threading depth
        permalinks/         URL structure
        menus/              Menu CRUD + location assignment
          [id]/page.tsx     Menu item editor (add / reorder / remove)
        api/page.tsx        Webhooks management
  api/
    auth/[...nextauth]/     NextAuth.js handler
    uploads/[...path]/      Static file server for uploaded media
    v1/                     REST API (see REST API section)
  robots.txt/route.ts       Dynamic robots.txt
  sitemap.xml/route.ts      Dynamic XML sitemap
  install/                  Install wizard (auto-advances when DB is ready)

components/
  ui/                       shadcn/ui primitives
  admin/                    Admin-specific components
  editor/                   TipTap wrapper
  install/                  Installer step forms
  site/                     Public components (SiteHeader, CommentForm)

lib/
  db/schema.ts              All 14 pl_* tables
  db/index.ts               Drizzle client
  db/migrations/            SQL migration files
  auth/config.ts            NextAuth v5 config
  api/auth.ts               authenticateRequest() helper
  api/response.ts           ok / created / paginated / badRequest / … helpers
  api/query.ts              parseQueryParams() + selectFields()
  api/webhooks.ts           fireWebhook / registerWebhook / removeWebhook
  actions/                  All server actions (posts, media, taxonomies, users, …)
  hooks/index.ts            HookSystem — addAction / addFilter / doAction / applyFilters
  options.ts                getOption / updateOption / getOptions
  postmeta.ts               getPostMeta / updatePostMeta / deletePostMeta
  storage.ts                uploadFile / deleteFile / buildUploadPath / getPublicUrl

plugins/
  pressload-seo/            Built-in SEO plugin (JSON-LD Article + Breadcrumb)

themes/
  pressload-default/        Built-in default theme

scripts/
  setup.js                  First-time installer CLI

tests/
  unit/                     Vitest unit tests
  e2e/                      Playwright E2E tests
```

---

## Database

All tables are prefixed `pl_` and live in `lib/db/schema.ts`.

| Table | Purpose |
|-------|---------|
| `pl_users` | User accounts — login, email, bcrypt password, display name |
| `pl_usermeta` | Per-user key/value — role, capabilities, bio, avatar, API key hash |
| `pl_posts` | All content types: posts, pages, attachments, revisions, nav items |
| `pl_postmeta` | Per-post key/value — thumbnail, SEO fields, attachment metadata |
| `pl_terms` | Category and tag names + slugs |
| `pl_term_taxonomy` | Connects terms to a taxonomy type + hierarchy + count |
| `pl_term_relationships` | Posts ↔ term_taxonomy many-to-many |
| `pl_termmeta` | Per-term metadata |
| `pl_comments` | Post comments — threaded via `comment_parent`, approval status |
| `pl_commentmeta` | Per-comment metadata |
| `pl_options` | Site-wide key/value settings (mirrors `wp_options`) |
| `pl_links` | Blogroll links |
| `pl_menus` | Named navigation menus with optional theme location |
| `pl_menu_items` | Individual menu items (label, URL, order) per menu |

---

## REST API

**Base URL:** `/api/v1/`

### Authentication

| Method | How |
|--------|-----|
| Bearer token | `Authorization: Bearer <api-key>` — generate at Admin → Profile → API Key |
| Session cookie | Automatic for browser requests after sign-in |

### Response envelope

```json
{ "data": { ... } }
{ "data": [...], "meta": { "total": 42, "page": 1, "per_page": 10, "total_pages": 5 } }
{ "error": "message" }
```

### Common query parameters

| Param | Default | Notes |
|-------|---------|-------|
| `page` | `1` | |
| `per_page` | `10` | Max `100` |
| `fields` | all | Comma-separated sparse fieldset: `?fields=id,title,slug` |
| `sort` | `date` | |
| `order` | `desc` | `asc` or `desc` |
| `status` | `publish` | `draft` / `pending` / `private` require auth |
| `search` | — | Full-text on title + excerpt |

### Endpoints

```
GET    /api/v1/posts                  List posts (filterable, paginated)
POST   /api/v1/posts                  Create post                        [auth]
GET    /api/v1/posts/{id|slug}        Single post by UUID or slug
PUT    /api/v1/posts/{id}             Update post                        [auth]
DELETE /api/v1/posts/{id}             Trash / delete post                [auth]

GET    /api/v1/pages                  List pages
GET    /api/v1/pages/{slug}           Single page

GET    /api/v1/media                  List media items
POST   /api/v1/media                  Upload file (multipart/form-data)  [auth]

GET    /api/v1/users                  List users                         [admin/editor]
GET    /api/v1/users/me               Authenticated user profile         [auth]

GET    /api/v1/taxonomies             All terms (categories + tags)
GET    /api/v1/taxonomies/{type}      Terms by type: category | post_tag

GET    /api/v1/settings               Public read-only site options

GET    /api/v1/menus/{location}       Menu items by theme location

GET    /api/v1/webhooks               List registered webhooks           [auth]
POST   /api/v1/webhooks               Register a webhook                 [auth]
DELETE /api/v1/webhooks/{id}          Remove a webhook                   [auth]
```

### Webhooks

Events fired: `post.created`, `post.updated`, `post.deleted`.

Each request to the registered URL includes:
- `X-Pressload-Event: post.created`
- `X-Pressload-Signature: sha256=<hmac>` (when a secret is configured)

---

## Plugins

Plugins live in `plugins/<name>/` and must contain a `pressload.plugin.json` manifest and an `index.ts` that exports a `register(hooks)` function.

```typescript
// plugins/my-plugin/index.ts
import type { HookSystem } from '@/lib/hooks'

export function register(hooks: HookSystem) {
  // Modify JSON-LD schemas on every post page
  hooks.addFilter('pressload.post.json_ld', (schemas, ctx) => {
    return [...(schemas as object[]), { '@type': 'MyType', name: ctx.postTitle }]
  })

  // React to a post being saved
  hooks.addAction('pressload.post.save', (postId: string) => {
    console.log('Post saved:', postId)
  })
}
```

```json
// plugins/my-plugin/pressload.plugin.json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Does something useful.",
  "main": "index.ts"
}
```

Activate via **Admin → Plugins**. Active plugins are stored in `pl_options.active_plugins` and loaded at server startup via `instrumentation.ts`.

---

## Themes

Themes live in `themes/<name>/` and require a `pressload.theme.json` manifest.

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "description": "My custom theme.",
  "locations": ["primary", "footer", "social"],
  "supports": ["featured-image", "custom-logo"]
}
```

Activate via **Admin → Themes**. The active theme name is stored in `pl_options.template`.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | — | NextAuth secret — minimum 32 characters |
| `NEXT_PUBLIC_APP_URL` | — | `http://localhost:3000` | Public-facing site URL |
| `UPLOADS_DIR` | — | `./uploads` | Directory where uploaded files are stored |
| `RESEND_API_KEY` | — | — | Resend API key for comment notification emails |

`npm run setup` writes `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` to `.env.local` automatically. Never commit `.env.local`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide — including how to write plugins, build themes, add REST endpoints, and run the test suite.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## License

ISC
