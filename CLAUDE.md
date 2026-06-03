# Pressload — Claude Code Guide

> **Status:** Phases 0–7 complete. Phase 8 (Testing & v1.0) is next.  
> Keep this file updated whenever a new module, convention, or rule is introduced.

---

## What is this project?

Pressload is a WordPress-parity CMS built on Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM, and NextAuth.js v5. It targets developers who want WordPress-like functionality with a modern stack.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Drizzle ORM |
| Auth | NextAuth.js v5 (Auth.js) — credentials provider |
| Editor | TipTap (rich block editor, Phase 2) |
| Storage | Local filesystem (`uploads/` dir, served via `/api/uploads/[...path]`) |
| Email | Resend (optional — `RESEND_API_KEY`) |
| Image processing | `sharp` |

---

## Repository Structure

```
app/
  (site)/                   Public-facing site
    layout.tsx              Uses SiteHeader (dynamic primary menu + blogname)
    page.tsx                Homepage
    blog/
      page.tsx              Blog archive
      [slug]/page.tsx       Single post (taxonomy links, comments, JSON-LD)
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
      posts/                List, new, [id] edit (PostForm with TipTap, SEO, categories, tags)
      pages/                List, new, [id] edit
      media/page.tsx        Media library (upload, grid, metadata)
      comments/page.tsx     Moderation queue (filter tabs, bulk actions)
      users/                List, new, [id] edit
      profile/page.tsx      Own profile + API key management
      plugins/page.tsx      Plugin list with activate/deactivate
      themes/page.tsx       Theme grid with activate
      settings/
        layout.tsx          Settings sidebar nav
        page.tsx            General (title, tagline, URL, email, timezone)
        reading/            Posts per page, homepage display
        discussion/         Comments, moderation, threading
        permalinks/         URL structure
        menus/              Menu CRUD + location assignment
          [id]/page.tsx     Menu item editor (add/reorder/remove)
        api/page.tsx        Webhooks management
  api/
    auth/[...nextauth]/     NextAuth handler
    uploads/[...path]/      Local file server (no auth — public files)
    v1/                     REST API (see REST API section)
  robots.txt/route.ts       Dynamic robots.txt
  sitemap.xml/route.ts      Dynamic sitemap
  install/                  4-step install wizard
components/
  ui/                       shadcn/ui (Button, Input, Card, Badge, Dialog…)
  admin/                    Admin components (Sidebar, PostForm, MediaLibraryClient,
                            MediaPicker, CommentActions, BulkCommentActions,
                            DeleteUserButton, MenuItemList, PluginToggle,
                            ThemeActivate, ApiKeySection, WebhookManager)
  editor/                   TipTap editor wrapper
  install/                  Installer step forms
  site/                     Public components (SiteHeader, CommentForm)
lib/
  db/
    schema.ts               All 14 pl_ tables (see Database section)
    index.ts                Drizzle client
    migrations/             Drizzle SQL migration files
  auth/
    config.ts               NextAuth v5 config
  api/
    auth.ts                 authenticateRequest() — Bearer token + session
    response.ts             ok/created/noContent/paginated/badRequest/… helpers
    query.ts                parseQueryParams() + selectFields()
    webhooks.ts             fireWebhook / registerWebhook / removeWebhook
  actions/                  All server actions
    posts.ts                createPost, updatePost, deletePost, publishPost, restoreRevision
    media.ts                uploadMedia, deleteMedia, updateMediaMeta, getMediaItems
    taxonomies.ts           getTerms, createTerm, updateTerm, deleteTerm,
                            assignTermsToPost, getPostTerms
    users.ts                getUsers, getUserById, createUser, updateUser, deleteUser,
                            updateProfile, generateApiKey, revokeApiKey, hasApiKey
    comments.ts             getComments, approveComment, spamComment, trashComment,
                            deleteComment, replyToComment, bulkUpdateComments, submitComment
    settings.ts             get/saveGeneralSettings, get/saveReadingSettings,
                            get/saveDiscussionSettings, get/savePermalinkSettings
    menus.ts                getMenus, getMenuById, getMenuByLocation, createMenu,
                            updateMenuName, deleteMenu, assignMenuLocation,
                            addMenuItem, updateMenuItem, removeMenuItem,
                            moveMenuItemUp, moveMenuItemDown
    plugins.ts              activatePlugin, deactivatePlugin, getAllPlugins
    themes.ts               activateTheme, getAllThemes, getActiveThemeName
  hooks/
    index.ts                HookSystem class + singleton + addAction/addFilter/doAction/applyFilters
  plugins/
    types.ts                PluginManifest, PluginModule, PluginInfo interfaces
    loader.ts               getAllPlugins(), initializePlugins() (called from instrumentation.ts)
  themes/
    types.ts                ThemeManifest, ThemeInfo interfaces
    loader.ts               getAllThemes(), getActiveTheme(), getActiveThemeName()
  options.ts                getOption, updateOption, deleteOption, getOptions
  postmeta.ts               getPostMeta, updatePostMeta, addPostMeta, deletePostMeta
  env.ts                    Zod env validation
  utils.ts                  cn()
  utils/
    slugify.ts              slugify()
    sanitize.ts             sanitizeHtml() (DOMPurify)
  site-config.ts            Static fallback site name
plugins/
  pressload-seo/            First-party SEO plugin (JSON-LD Article + Breadcrumb)
    pressload.plugin.json
    index.ts                register(hooks) — adds pressload.post.json_ld filter
themes/
  pressload-default/        Default theme
    pressload.theme.json    Manifest (locations, supports, template map)
instrumentation.ts          Next.js startup: calls initializePlugins()
middleware.ts               Protects /admin/* routes
```

---

## Database Table Overview

All 14 `pl_` tables in `lib/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `pl_users` | User accounts (login, email, bcrypt password, display name) |
| `pl_usermeta` | Per-user key/value (role, capabilities, bio, avatar, API key hash) |
| `pl_posts` | All content: posts, pages, attachments, revisions, nav items |
| `pl_postmeta` | Per-post key/value (thumbnail, SEO fields, attachment metadata) |
| `pl_terms` | Category/tag names and slugs |
| `pl_term_taxonomy` | Connects terms to taxonomy type (category, post_tag) + hierarchy + count |
| `pl_term_relationships` | Posts ↔ term_taxonomy many-to-many |
| `pl_termmeta` | Per-term metadata |
| `pl_comments` | Post comments (threaded via comment_parent, approval status) |
| `pl_commentmeta` | Per-comment metadata |
| `pl_options` | Site-wide key/value settings (mirrors wp_options) |
| `pl_links` | Blogroll links (WordPress parity) |
| `pl_menus` | Named navigation menus with theme location assignment |
| `pl_menu_items` | Individual menu items (label, URL, order) per menu |

### Important postmeta keys

| Key | Purpose |
|-----|---------|
| `_thumbnail_id` | Featured image attachment ID |
| `_wp_attached_file` | Upload path relative to UPLOADS_DIR |
| `_wp_attachment_metadata` | JSON: width, height, filesize, sizes |
| `_wp_attachment_image_alt` | Image alt text |
| `_seo_title` | Per-post SEO title override |
| `_seo_description` | Meta description |
| `_seo_canonical` | Canonical URL |
| `_seo_noindex` | `'1'` to noindex |
| `_seo_og_image_url` | Open Graph image URL |
| `_edit_last` | User ID who last edited |

### Important usermeta keys

| Key | Purpose |
|-----|---------|
| `pl_user_role` | Role name: administrator \| editor \| author \| contributor \| subscriber |
| `pl_capabilities` | JSON: `{"administrator": true}` (WordPress-style) |
| `description` | Bio |
| `avatar_url` | Avatar image URL |
| `api_key_hash` | SHA-256 hash of the user's REST API key |

### Important pl_options keys

| Key | Purpose |
|-----|---------|
| `blogname` | Site title |
| `blogdescription` | Tagline |
| `siteurl` | Site URL |
| `admin_email` | Admin email |
| `timezone_string` | Timezone (e.g. `Europe/London`) |
| `show_on_front` | `posts` or `page` |
| `posts_per_page` | Blog pagination size |
| `permalink_structure` | URL structure (e.g. `/%postname%/`) |
| `default_comment_status` | `open` or `closed` |
| `template` / `stylesheet` | Active theme name |
| `active_plugins` | JSON array of active plugin names |
| `webhooks` | JSON array of WebhookConfig objects |

---

## Drizzle ORM Patterns

```typescript
import { db } from '@/lib/db'
import { users, posts } from '@/lib/db/schema'
import { eq, and, desc, count, ilike } from 'drizzle-orm'

// findFirst / findMany (relational)
const user = await db.query.users.findFirst({ where: eq(users.userEmail, email) })

// select with join
const rows = await db
  .select({ id: posts.id, authorName: users.displayName })
  .from(posts)
  .leftJoin(users, eq(posts.postAuthor, users.id))
  .where(eq(posts.postStatus, 'publish'))

// insert + returning
const [post] = await db.insert(posts).values({ ... }).returning()

// update
await db.update(posts).set({ postStatus: 'publish' }).where(eq(posts.id, id))

// delete
await db.delete(posts).where(eq(posts.id, id))

// count
const [{ total }] = await db.select({ total: count() }).from(posts).where(where)
```

### Migration commands

```bash
npm run db:generate   # Generate SQL from schema changes
npm run db:migrate    # Apply pending migrations to DB
npm run db:push       # Push schema directly (dev only — no migration file)
npm run db:studio     # Open Drizzle Studio
```

---

## Options API

```typescript
import { getOption, updateOption, getOptions } from '@/lib/options'

const title = await getOption('blogname', 'My Site')
await updateOption('blogname', 'New Title')
const opts = await getOptions(['blogname', 'blogdescription'])  // Record<string, string>
```

---

## Post Meta API

```typescript
import { getPostMeta, updatePostMeta, deletePostMeta } from '@/lib/postmeta'

const val = await getPostMeta(postId, '_seo_title', true)  // string
await updatePostMeta(postId, '_seo_title', 'Override Title')
await deletePostMeta(postId, '_seo_title')
```

---

## Hook System (Plugin API)

```typescript
import { addAction, addFilter, doAction, applyFilters, hooks } from '@/lib/hooks'

// Register (typically inside a plugin's register() function)
addFilter('pressload.post.json_ld', (schemas, ctx) => [...schemas, { '@type': 'Article' }])
addAction('pressload.post.save', (postId) => { /* side effect */ })

// Fire (in page/action code)
const schemas = hooks.applyFilters('pressload.post.json_ld', [], { postTitle, siteUrl })
hooks.doAction('pressload.post.save', postId)
```

Plugins are in `plugins/<name>/` with `pressload.plugin.json` and an `index.ts` exporting `register(hooks)`.  
`instrumentation.ts` calls `initializePlugins()` at server startup to load active plugins.

---

## Auth Patterns

### Server components / layouts

```typescript
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

const session = await auth()
if (!session) redirect('/signin')
```

### REST API routes (use the shared helper)

```typescript
import { authenticateRequest } from '@/lib/api/auth'
import { unauthorized } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  const apiUser = await authenticateRequest(req)
  if (!apiUser) return unauthorized()
  // ...
}
```

`authenticateRequest` checks `Authorization: Bearer <api-key>` first (SHA-256 hash vs `pl_usermeta`), then falls back to NextAuth session cookie.

---

## Server Actions

All mutations in the admin go through server actions in `lib/actions/`. Pattern:

```typescript
'use server'
import { auth } from '@/lib/auth/config'

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function createPost(formData: FormData) {
  const session = await requireAuth()
  // ...
  revalidatePath('/posts')
}
```

---

## REST API (`/api/v1/`)

### Response envelope

```json
{ "data": <payload> }
{ "data": [...], "meta": { "total": 42, "page": 1, "per_page": 10, "total_pages": 5 } }
{ "error": "message" }
```

### Standard query params

| Param | Default | Notes |
|-------|---------|-------|
| `page` | 1 | Pagination |
| `per_page` | 10 | Max 100 |
| `fields` | all | Comma-separated field names |
| `sort` | date | Field to sort by |
| `order` | desc | `asc` or `desc` |
| `status` | publish | Post status filter |
| `search` | — | Full-text search on title/excerpt |

### Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET/POST | `/api/v1/posts` | Public/Bearer | List (filtered/paginated) + create |
| GET/PUT/DELETE | `/api/v1/posts/[id]` | Public/Bearer | Read by ID or slug; mutate by UUID |
| GET | `/api/v1/pages` | Public | Paginated pages list |
| GET | `/api/v1/pages/[slug]` | Public | Single page |
| GET/POST | `/api/v1/media` | Public/Bearer | List + upload (multipart) |
| GET | `/api/v1/users` | Admin/Editor | User list |
| GET | `/api/v1/users/me` | Bearer/Session | Authenticated user |
| GET | `/api/v1/taxonomies` | Public | All terms |
| GET | `/api/v1/taxonomies/[type]` | Public | `category` or `post_tag` |
| GET | `/api/v1/settings` | Public | Read-only public options |
| GET | `/api/v1/menus/[location]` | Public | Menu items for a location |
| GET/POST | `/api/v1/webhooks` | Bearer | List + register |
| DELETE | `/api/v1/webhooks/[id]` | Bearer | Remove webhook |

### Webhook events fired

- `post.created` — on createPost
- `post.updated` — on updatePost
- `post.deleted` — on deletePost

Payload POSTed to registered URLs with `X-Pressload-Event` header.  
If a secret is configured, `X-Pressload-Signature: sha256=<hmac>` is included.

---

## Storage

Uploads live in `UPLOADS_DIR` (default: `./uploads`). Files are served via `/api/uploads/[...path]` with path-traversal guard.

```typescript
import { uploadFile, deleteFile, getPublicUrl, buildUploadPath } from '@/lib/storage'

const path = buildUploadPath('photo.jpg')       // → '2026/06/1718000000000-photo.jpg'
const { url } = await uploadFile(buffer, path, 'image/jpeg')  // url = '/api/uploads/...'
```

URLs stored in `posts.guid` and `postmeta._wp_attached_file` are always relative (`/api/uploads/...`).  
Use `getOption('siteurl')` when you need absolute URLs (e.g. sitemaps, OG tags).

---

## Taxonomy Patterns

```typescript
import { getTerms, getPostTerms, assignTermsToPost } from '@/lib/actions/taxonomies'

const categories = await getTerms('category')           // TermOption[]
const postCats   = await getPostTerms(postId, 'category')
await assignTermsToPost(postId, ['ttId1', 'ttId2'], 'category')
```

---

## Tailwind + shadcn/ui

### Color tokens — always use, never raw hex

| Token | Usage |
|-------|-------|
| `bg-background` | Page background |
| `bg-card` | Card / surface |
| `bg-muted` | Subtle surface |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / dimmed |
| `text-primary` | Accent / links |
| `border-border` | Default borders |

### Imports

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

<div className={cn('base', isActive && 'active', className)} />
```

---

## Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | — | NextAuth secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | — | `http://localhost:3000` | Used for absolute URLs |
| `UPLOADS_DIR` | — | `./uploads` | Where uploaded files are stored |
| `RESEND_API_KEY` | — | — | Email notifications for comments |

---

## Key Rules

1. **Never commit `.env.local` or any secrets**
2. **All admin mutations use Server Actions** in `lib/actions/` — no ad-hoc API routes for admin CRUD
3. **REST API routes live in `app/api/v1/`** — use `lib/api/auth`, `lib/api/response`, `lib/api/query` helpers
4. **All admin pages live in `app/(admin)/(protected)/`** — middleware + layout guard them
5. **All DB queries go through `lib/db`** — never create raw connections
6. **Always use `revalidatePath()`** after mutations that affect cached pages
7. **Run `npm run typecheck` before committing** — CI will catch it anyway
8. **`/uploads/` is gitignored** — never commit uploaded files
9. **Plugin hooks must be pure and synchronous** — `doAction`/`applyFilters` are synchronous; use async carefully
10. **New schema tables need a migration** — run `npm run db:generate` then `npm run db:migrate`
