# Changelog

All notable changes to Pressload are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — Phase 8

### Added
- Vitest unit tests: hook system, slugify, query params, API responses, webhooks (52 tests)
- Playwright E2E test suite: auth flow, post create/publish, comment submission
- GitHub Actions CI: typecheck → lint → unit tests → build → E2E (on PR)
- HTTP security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Content-Security-Policy`, `Permissions-Policy`
- In-memory rate limiter on auth endpoints (20 req / 10 min per IP)
- `/comments` and `/profile` routes added to middleware protected paths
- `CONTRIBUTING.md` with plugin, theme, and code contribution guides

### Fixed
- `slugify()` now collapses consecutive hyphens (e.g. `one--two` → `one-two`)
- `parseQueryParams()` now correctly clamps `per_page=0` to 1 instead of falling back to 10

---

## [0.7.0] — Phase 7: REST API

### Added
- REST API at `/api/v1/` with 13 endpoint groups
- Bearer token authentication (SHA-256 API key stored in `pl_usermeta`)
- Standard response envelope `{ data, meta: { total, page, per_page, total_pages } }`
- Query params: `page`, `per_page` (max 100), `fields`, `sort`, `order`, `status`, `search`
- Endpoints: posts (CRUD), pages (read), media (list + upload), users (list + me), taxonomies, settings, menus, webhooks
- Webhook system: register URLs with events + HMAC secret; fires `post.created/updated/deleted`
- API key management on user profile page (generate / regenerate / revoke)
- Webhook admin UI at `/admin/settings/api`

---

## [0.6.0] — Phase 6: Plugin & Theme System

### Added
- Hook system (`lib/hooks/`) — `addAction`, `addFilter`, `doAction`, `applyFilters` with priority ordering
- Plugin loader: scans `plugins/` for `pressload.plugin.json`, dynamically imports active plugins at startup via `instrumentation.ts`
- Theme loader: scans `themes/` for `pressload.theme.json`, reads active theme from `pl_options`
- First-party plugin: `plugins/pressload-seo/` — adds Article + BreadcrumbList JSON-LD to post pages
- Default theme: `themes/pressload-default/` — manifest with locations, supports, template map
- Admin: `/admin/plugins` (activate/deactivate) and `/admin/themes` (activate) use real filesystem data

---

## [0.5.0] — Phase 5: Settings, Menus & SEO

### Added
- Options API (`lib/options.ts`) — `getOption`, `updateOption`, `getOptions`
- Settings pages: General, Reading, Discussion, Permalinks (all backed by `pl_options`)
- `pl_menus` and `pl_menu_items` schema tables (Drizzle migration included)
- Menu builder at `/admin/settings/menus/[id]` — add/edit/reorder/remove items, assign to locations
- Dynamic site header — reads primary menu + `blogname` from DB
- Per-post SEO panel in PostForm — title, description (160-char counter), canonical, OG image, noindex
- `generateMetadata` on blog post pages — full title, description, robots, canonical, OG tags
- Dynamic `robots.txt` and `sitemap.xml` route handlers

---

## [0.4.0] — Phase 4: Taxonomies, Users & Comments

### Added
- Categories (hierarchical checkboxes) and tags (chip input) in post editor sidebar
- Public `/blog/category/[slug]` and `/blog/tag/[slug]` archive pages
- Category/tag links on single post page
- User management: `/admin/users` (list with role badges), `/admin/users/new`, `/admin/users/[id]`
- User profile page at `/admin/profile`
- Roles stored in `pl_usermeta` as `pl_user_role` + `pl_capabilities`
- Comment moderation: `/admin/comments` with filter tabs, bulk actions, per-row quick actions
- Public comment form on blog posts → pending moderation
- Threaded comment display (up to 3 levels) on public posts
- Email notification to post author via Resend (skipped if `RESEND_API_KEY` not set)
- Comments and Profile added to admin sidebar

---

## [0.3.0] — Phase 3: Media Library (local filesystem)

### Added
- Local filesystem storage (`lib/storage.ts`) — files written to `UPLOADS_DIR/YYYY/MM/`
- `/api/uploads/[...path]` route handler with path-traversal guard
- Media library UI: drag-drop upload, grid view, metadata editing, delete
- Image resizing via `sharp` (thumbnail 150×150, medium 300×300, large 1024×1024)
- Featured image picker using `MediaPicker` component
- Media stored as `pl_posts` with `postType='attachment'`; metadata in `pl_postmeta`
- Removed `@supabase/supabase-js` dependency

---

## [0.2.0] — Phase 2: Block Editor

### Added
- TipTap rich text editor replacing plain textarea
- Toolbar: Bold, Italic, Underline, Strike, H1–H3, lists, blockquote, code block, link, image, table
- TipTap JSON stored in `postContentJson`; HTML in `postContent`
- Autosave every 30 seconds (debounced)
- Image insertion via Media Library picker

---

## [0.1.0] — Phase 1: Post & Page CRUD

### Added
- Post and page list, create, edit, delete, trash, publish
- Auto-generated slugs with uniqueness check
- Revision history with restore
- Public blog archive and single post rendering
- Static page rendering at `/(site)/[slug]`
- HTML sanitisation via DOMPurify

---

## [0.0.1] — Phase 0: Foundation

### Added
- Next.js 16 App Router scaffold
- Tailwind CSS v4 + shadcn/ui (Button, Input, Card, Badge, Dialog, etc.)
- Drizzle ORM with full 12-table `pl_` schema (WordPress-parity)
- NextAuth.js v5 credentials provider; JWT sessions; protected route middleware
- 4-step install wizard: DB test → create tables → site setup → success
- Admin shell layout with sidebar navigation
- `lib/env.ts` Zod environment validation
