# Pressload — Implementation Plan

**Version:** 1.0 | **Date:** May 2026  
**Status:** Ready to build  
**Codebase state:** Clean Next.js 16 App Router scaffold — layout, header, 2 placeholder routes, site config. No database, no auth, no CMS logic yet.

---

## Stack Decisions (Final)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router) | Already in place |
| Language | TypeScript (strict) | Already configured |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, accessible |
| Database | PostgreSQL via Supabase | Managed Postgres, real-time, auth built-in |
| ORM | Drizzle ORM | TypeScript-native, lightweight, no magic |
| Auth | NextAuth.js v5 (Auth.js) | Credentials + OAuth (Google, GitHub) |
| Block editor | TipTap | Best React block editor, extensible, MIT licence |
| File storage | Supabase Storage | S3-compatible, built into Supabase |
| Email | Resend | Simple API, reliable delivery |
| Payments | Stripe | For future hosted/premium plan |
| Testing | Vitest + Playwright | Unit + E2E |
| Package manager | npm | Already in place |

---

## Repository Structure (Target)

```
pressload/
├── app/
│   ├── (site)/                     # Public-facing site (theme-rendered)
│   │   ├── layout.tsx              # Theme layout wrapper
│   │   ├── page.tsx                # Homepage (latest posts or static)
│   │   ├── [slug]/page.tsx         # Static pages
│   │   ├── blog/page.tsx           # Blog archive
│   │   └── blog/[slug]/page.tsx    # Single post
│   └── (admin)/                    # Admin dashboard (auth-protected)
│       ├── layout.tsx              # Admin shell layout
│       ├── dashboard/page.tsx      # Overview / activity
│       ├── posts/
│       │   ├── page.tsx            # Post list
│       │   ├── new/page.tsx        # New post
│       │   └── [id]/page.tsx       # Edit post
│       ├── pages/
│       ├── media/page.tsx
│       ├── users/page.tsx
│       ├── plugins/page.tsx
│       ├── themes/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── admin/                      # Admin UI components
│   ├── editor/                     # Block editor components
│   └── site/                       # Public site components
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema (all tables)
│   │   ├── index.ts                # DB connection
│   │   └── migrations/             # Drizzle migration files
│   ├── auth/
│   │   └── config.ts               # NextAuth config
│   ├── hooks/
│   │   └── index.ts                # Plugin hook system (addAction, addFilter)
│   ├── plugins/
│   │   └── loader.ts               # Plugin manifest loader
│   ├── themes/
│   │   └── loader.ts               # Theme manifest loader
│   └── site-config.ts             # Existing config
├── plugins/                        # First-party bundled plugins
│   └── pressload-seo/
│       ├── pressload.plugin.json
│       └── index.ts
├── themes/                         # First-party themes
│   └── pressload-default/
│       ├── pressload.theme.json
│       └── templates/
├── public/
├── IMPLEMENTATION_PLAN.md          # This file
├── PRD.md
└── CLAUDE.md
```

---

## Database Architecture — Full WordPress-Parity Schema

This section defines the **complete database schema** Pressload will create on first install — modelled closely on WordPress's table structure but written in modern PostgreSQL with Drizzle ORM. All tables are created automatically by the installer (see Phase 0).

### Table Overview

| Table | WordPress Equivalent | Purpose |
|-------|---------------------|---------|
| `pl_posts` | `wp_posts` | All content: posts, pages, revisions, attachments, nav items, custom types |
| `pl_postmeta` | `wp_postmeta` | Arbitrary key/value metadata per post |
| `pl_users` | `wp_users` | User accounts |
| `pl_usermeta` | `wp_usermeta` | Arbitrary key/value metadata per user |
| `pl_terms` | `wp_terms` | Category, tag, and taxonomy term names |
| `pl_term_taxonomy` | `wp_term_taxonomy` | Connects terms to a taxonomy type (category, tag, custom) |
| `pl_term_relationships` | `wp_term_relationships` | Connects posts to terms |
| `pl_termmeta` | `wp_termmeta` | Metadata per taxonomy term |
| `pl_comments` | `wp_comments` | Post comments |
| `pl_commentmeta` | `wp_commentmeta` | Metadata per comment |
| `pl_options` | `wp_options` | Site-wide key/value settings store |
| `pl_links` | `wp_links` | Blogroll links (legacy, included for parity) |

All tables use the `pl_` prefix. The prefix is configurable at install time (like WordPress's `wp_` → anything).

---

### Full Schema Definition

```typescript
// lib/db/schema.ts

import {
  pgTable, uuid, text, integer, bigint, boolean,
  timestamp, jsonb, index, uniqueIndex, primaryKey
} from 'drizzle-orm/pg-core'

// ─── pl_users ────────────────────────────────────────────────────────────────
// Core user accounts. Mirrors wp_users closely.
export const users = pgTable('pl_users', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userLogin:         text('user_login').notNull().unique(),      // username
  userPass:          text('user_pass').notNull(),                // bcrypt hash
  userNicename:      text('user_nicename').notNull(),            // URL-friendly name
  userEmail:         text('user_email').notNull().unique(),
  userUrl:           text('user_url').default(''),
  userRegistered:    timestamp('user_registered').defaultNow(),
  userActivationKey: text('user_activation_key').default(''),   // password reset
  userStatus:        integer('user_status').default(0),
  displayName:       text('display_name').notNull(),
}, (t) => ({
  loginIdx:  index('pl_users_login_idx').on(t.userLogin),
  emailIdx:  index('pl_users_email_idx').on(t.userEmail),
}))

// ─── pl_usermeta ─────────────────────────────────────────────────────────────
// Arbitrary per-user metadata. Stores: role, capabilities, bio, avatar, etc.
export const usermeta = pgTable('pl_usermeta', {
  umetaId:   bigint('umeta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => ({
  userIdIdx: index('pl_usermeta_user_id_idx').on(t.userId),
  metaKeyIdx: index('pl_usermeta_meta_key_idx').on(t.metaKey),
}))

// ─── pl_posts ─────────────────────────────────────────────────────────────────
// The universal content table. Stores posts, pages, revisions,
// attachments (media), nav_menu_items, and any custom post type.
export const posts = pgTable('pl_posts', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  postAuthor:          uuid('post_author').references(() => users.id),
  postDate:            timestamp('post_date').defaultNow(),
  postDateGmt:         timestamp('post_date_gmt').defaultNow(),
  postContent:         text('post_content').default(''),         // rendered HTML
  postContentJson:     jsonb('post_content_json'),               // TipTap JSON doc
  postTitle:           text('post_title').notNull().default(''),
  postExcerpt:         text('post_excerpt').default(''),
  postStatus:          text('post_status').notNull().default('draft'),
                       // publish | future | draft | pending | private | trash | auto-draft | inherit
  commentStatus:       text('comment_status').notNull().default('open'),   // open | closed
  pingStatus:          text('ping_status').notNull().default('open'),
  postPassword:        text('post_password').default(''),        // password-protected posts
  postName:            text('post_name').notNull().default(''),  // slug
  toPing:              text('to_ping').default(''),
  pinged:              text('pinged').default(''),
  postModified:        timestamp('post_modified').defaultNow(),
  postModifiedGmt:     timestamp('post_modified_gmt').defaultNow(),
  postContentFiltered: text('post_content_filtered').default(''),
  postParent:          uuid('post_parent'),                      // revisions, page hierarchy
  guid:                text('guid').default(''),                 // globally unique URL
  menuOrder:           integer('menu_order').default(0),         // page/nav ordering
  postType:            text('post_type').notNull().default('post'),
                       // post | page | attachment | revision | nav_menu_item | custom
  postMimeType:        text('post_mime_type').default(''),       // for attachments
  commentCount:        bigint('comment_count', { mode: 'number' }).default(0),
}, (t) => ({
  postNameIdx:    index('pl_posts_post_name_idx').on(t.postName),
  postTypeIdx:    index('pl_posts_post_type_idx').on(t.postType),
  postStatusIdx:  index('pl_posts_post_status_idx').on(t.postStatus),
  postAuthorIdx:  index('pl_posts_post_author_idx').on(t.postAuthor),
  postParentIdx:  index('pl_posts_post_parent_idx').on(t.postParent),
  postDateIdx:    index('pl_posts_post_date_idx').on(t.postDate),
}))

// ─── pl_postmeta ──────────────────────────────────────────────────────────────
// Arbitrary per-post metadata. Stores: SEO fields, featured image ID,
// custom fields, plugin data, theme options per post.
export const postmeta = pgTable('pl_postmeta', {
  metaId:    bigint('meta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => ({
  postIdIdx:  index('pl_postmeta_post_id_idx').on(t.postId),
  metaKeyIdx: index('pl_postmeta_meta_key_idx').on(t.metaKey),
}))

// ─── pl_terms ─────────────────────────────────────────────────────────────────
// Term names: "Technology", "News", "recipe" etc.
// Shared across all taxonomies — the taxonomy is in pl_term_taxonomy.
export const terms = pgTable('pl_terms', {
  termId:    uuid('term_id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  slug:      text('slug').notNull(),
  termGroup: bigint('term_group', { mode: 'number' }).default(0),
}, (t) => ({
  slugIdx: uniqueIndex('pl_terms_slug_idx').on(t.slug),
  nameIdx: index('pl_terms_name_idx').on(t.name),
}))

// ─── pl_term_taxonomy ─────────────────────────────────────────────────────────
// Associates a term with a taxonomy type and tracks hierarchy + usage count.
export const termTaxonomy = pgTable('pl_term_taxonomy', {
  termTaxonomyId: uuid('term_taxonomy_id').primaryKey().defaultRandom(),
  termId:         uuid('term_id').notNull().references(() => terms.termId, { onDelete: 'cascade' }),
  taxonomy:       text('taxonomy').notNull(),    // category | post_tag | nav_menu | custom
  description:    text('description').default(''),
  parent:         uuid('parent'),               // hierarchical categories
  count:          bigint('count', { mode: 'number' }).default(0),
}, (t) => ({
  taxonomyIdx:       index('pl_term_taxonomy_taxonomy_idx').on(t.taxonomy),
  termIdTaxonomyIdx: uniqueIndex('pl_term_taxonomy_term_id_taxonomy_idx').on(t.termId, t.taxonomy),
}))

// ─── pl_term_relationships ────────────────────────────────────────────────────
// Many-to-many: posts ↔ term_taxonomy
export const termRelationships = pgTable('pl_term_relationships', {
  objectId:       uuid('object_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  termTaxonomyId: uuid('term_taxonomy_id').notNull().references(() => termTaxonomy.termTaxonomyId, { onDelete: 'cascade' }),
  termOrder:      integer('term_order').default(0),
}, (t) => ({
  pk:             primaryKey({ columns: [t.objectId, t.termTaxonomyId] }),
  termTaxIdIdx:   index('pl_term_relationships_term_taxonomy_id_idx').on(t.termTaxonomyId),
}))

// ─── pl_termmeta ──────────────────────────────────────────────────────────────
// Arbitrary per-term metadata (e.g. category description, thumbnail image)
export const termmeta = pgTable('pl_termmeta', {
  metaId:    bigint('meta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  termId:    uuid('term_id').notNull().references(() => terms.termId, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => ({
  termIdIdx:  index('pl_termmeta_term_id_idx').on(t.termId),
  metaKeyIdx: index('pl_termmeta_meta_key_idx').on(t.metaKey),
}))

// ─── pl_comments ──────────────────────────────────────────────────────────────
// All comments on posts. Supports threading via comment_parent.
export const comments = pgTable('pl_comments', {
  commentId:          uuid('comment_id').primaryKey().defaultRandom(),
  commentPostId:      uuid('comment_post_id').references(() => posts.id, { onDelete: 'cascade' }),
  commentAuthor:      text('comment_author').notNull().default(''),
  commentAuthorEmail: text('comment_author_email').notNull().default(''),
  commentAuthorUrl:   text('comment_author_url').default(''),
  commentAuthorIp:    text('comment_author_ip').default(''),     // for spam detection
  commentDate:        timestamp('comment_date').defaultNow(),
  commentDateGmt:     timestamp('comment_date_gmt').defaultNow(),
  commentContent:     text('comment_content').notNull(),
  commentKarma:       integer('comment_karma').default(0),
  commentApproved:    text('comment_approved').notNull().default('1'),
                      // 1 (approved) | 0 (pending) | spam | trash
  commentAgent:       text('comment_agent').default(''),         // browser user agent
  commentType:        text('comment_type').default('comment'),   // comment | pingback | trackback
  commentParent:      uuid('comment_parent'),                    // threaded reply
  userId:             uuid('user_id'),                           // if logged-in commenter
}, (t) => ({
  postIdIdx:      index('pl_comments_comment_post_id_idx').on(t.commentPostId),
  approvedIdx:    index('pl_comments_comment_approved_idx').on(t.commentApproved),
  parentIdx:      index('pl_comments_comment_parent_idx').on(t.commentParent),
  userIdIdx:      index('pl_comments_user_id_idx').on(t.userId),
  authorEmailIdx: index('pl_comments_author_email_idx').on(t.commentAuthorEmail),
}))

// ─── pl_commentmeta ───────────────────────────────────────────────────────────
// Arbitrary per-comment metadata (e.g. akismet spam score)
export const commentmeta = pgTable('pl_commentmeta', {
  metaId:    bigint('meta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  commentId: uuid('comment_id').notNull().references(() => comments.commentId, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => ({
  commentIdIdx: index('pl_commentmeta_comment_id_idx').on(t.commentId),
  metaKeyIdx:   index('pl_commentmeta_meta_key_idx').on(t.metaKey),
}))

// ─── pl_options ───────────────────────────────────────────────────────────────
// Site-wide key/value settings. The single source of truth for all config.
// Mirrors wp_options exactly. Everything from site title to plugin settings lives here.
export const options = pgTable('pl_options', {
  optionId:    bigint('option_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  optionName:  text('option_name').notNull().unique(),
  optionValue: text('option_value').notNull().default(''),
  autoload:    text('autoload').notNull().default('yes'),    // yes | no — loaded on every request
}, (t) => ({
  optionNameIdx: uniqueIndex('pl_options_option_name_idx').on(t.optionName),
  autoloadIdx:   index('pl_options_autoload_idx').on(t.autoload),
}))

// ─── pl_links ─────────────────────────────────────────────────────────────────
// Blogroll links — legacy, included for WordPress parity.
export const links = pgTable('pl_links', {
  linkId:          uuid('link_id').primaryKey().defaultRandom(),
  linkUrl:         text('link_url').notNull().default(''),
  linkName:        text('link_name').notNull().default(''),
  linkImage:       text('link_image').default(''),
  linkTarget:      text('link_target').default(''),
  linkDescription: text('link_description').default(''),
  linkVisible:     text('link_visible').notNull().default('Y'),
  linkOwner:       uuid('link_owner').references(() => users.id),
  linkRating:      integer('link_rating').default(0),
  linkUpdated:     timestamp('link_updated').defaultNow(),
  linkRel:         text('link_rel').default(''),
  linkNotes:       text('link_notes').default(''),
  linkRss:         text('link_rss').default(''),
})
```

### Default Options Seeded on Install

These `pl_options` rows are inserted during installation — equivalent to WordPress's default options:

```typescript
const DEFAULT_OPTIONS = [
  // Site identity
  { optionName: 'siteurl',            optionValue: process.env.SITE_URL },
  { optionName: 'blogname',           optionValue: 'My Pressload Site' },
  { optionName: 'blogdescription',    optionValue: 'Just another Pressload site' },
  { optionName: 'admin_email',        optionValue: adminEmail },
  { optionName: 'pressload_version',  optionValue: '1.0.0' },
  { optionName: 'db_version',         optionValue: '1' },

  // Reading settings
  { optionName: 'show_on_front',      optionValue: 'posts' },  // posts | page
  { optionName: 'page_on_front',      optionValue: '' },
  { optionName: 'page_for_posts',     optionValue: '' },
  { optionName: 'posts_per_page',     optionValue: '10' },
  { optionName: 'posts_per_rss',      optionValue: '10' },
  { optionName: 'rss_use_excerpt',    optionValue: '0' },

  // Discussion settings
  { optionName: 'default_comment_status',     optionValue: 'open' },
  { optionName: 'default_ping_status',        optionValue: 'open' },
  { optionName: 'comment_moderation',         optionValue: '0' },
  { optionName: 'comment_registration',       optionValue: '0' },
  { optionName: 'comments_notify',            optionValue: '1' },
  { optionName: 'moderation_notify',          optionValue: '1' },
  { optionName: 'close_comments_for_old_posts', optionValue: '0' },
  { optionName: 'close_comments_days_old',    optionValue: '14' },
  { optionName: 'thread_comments',            optionValue: '1' },
  { optionName: 'thread_comments_depth',      optionValue: '5' },

  // Media settings
  { optionName: 'thumbnail_size_w',   optionValue: '150' },
  { optionName: 'thumbnail_size_h',   optionValue: '150' },
  { optionName: 'thumbnail_crop',     optionValue: '1' },
  { optionName: 'medium_size_w',      optionValue: '300' },
  { optionName: 'medium_size_h',      optionValue: '300' },
  { optionName: 'large_size_w',       optionValue: '1024' },
  { optionName: 'large_size_h',       optionValue: '1024' },
  { optionName: 'uploads_use_yearmonth_folders', optionValue: '1' },

  // Permalink settings
  { optionName: 'permalink_structure', optionValue: '/%postname%/' },

  // Active theme and plugins
  { optionName: 'template',           optionValue: 'pressload-default' },
  { optionName: 'stylesheet',         optionValue: 'pressload-default' },
  { optionName: 'active_plugins',     optionValue: JSON.stringify(['pressload-seo/index.ts']) },

  // User roles/capabilities (serialised like WordPress)
  { optionName: 'pl_user_roles', optionValue: JSON.stringify({
    administrator: { name: 'Administrator', capabilities: { manage_options: true, edit_posts: true, publish_posts: true, edit_others_posts: true, delete_posts: true, manage_users: true } },
    editor:        { name: 'Editor',        capabilities: { edit_posts: true, publish_posts: true, edit_others_posts: true, delete_posts: true } },
    author:        { name: 'Author',        capabilities: { edit_posts: true, publish_posts: true, delete_posts: true } },
    contributor:   { name: 'Contributor',   capabilities: { edit_posts: true } },
    subscriber:    { name: 'Subscriber',    capabilities: { read: true } },
  })},

  // Time/date
  { optionName: 'timezone_string',    optionValue: 'Europe/Dublin' },
  { optionName: 'date_format',        optionValue: 'F j, Y' },
  { optionName: 'time_format',        optionValue: 'g:i a' },
  { optionName: 'start_of_week',      optionValue: '1' },
]
```

### Options API

A helper modelled on WordPress's `get_option()` / `update_option()`:

```typescript
// lib/options.ts
export async function getOption(name: string, defaultValue = ''): Promise<string>
export async function updateOption(name: string, value: string): Promise<void>
export async function deleteOption(name: string): Promise<void>
export async function getOptions(names: string[]): Promise<Record<string, string>>

// Autoloaded options cached in memory on startup
// (like WordPress's object cache for autoload=yes options)
export async function loadAutoloadedOptions(): Promise<void>
```

### Post Meta API

Modelled on WordPress's `get_post_meta()` / `update_post_meta()`:

```typescript
// lib/postmeta.ts
export async function getPostMeta(postId: string, key: string, single?: boolean): Promise<string | string[]>
export async function updatePostMeta(postId: string, key: string, value: string): Promise<void>
export async function addPostMeta(postId: string, key: string, value: string): Promise<void>
export async function deletePostMeta(postId: string, key: string): Promise<void>
```

---

## Installer — WordPress-Style Setup Wizard

On first visit to a fresh Pressload install (no `pl_options` table exists), the app redirects to `/install`. This is Pressload's equivalent of WordPress's famous 5-minute install.

### Install Flow

**Step 1 — Database connection** (`/install`)
- Input: `DATABASE_URL` (or individual host/user/pass/dbname fields)
- Action: test connection, check if tables already exist
- Next: if tables exist → redirect to `/admin` login. If not → Step 2.

**Step 2 — Create database tables** (`/install/database`)
- Runs all Drizzle migrations programmatically
- Creates all 12 `pl_` tables with correct indexes
- Shows progress: "Creating pl_users... ✓", "Creating pl_posts... ✓" etc.
- On complete → Step 3

**Step 3 — Site information** (`/install/setup`)
- Form fields:
  - Site Title
  - Site URL (pre-filled from env)
  - Admin Email
  - Admin Username
  - Admin Password (with strength indicator)
  - Admin Password (confirm)
  - Language
  - Timezone
- On submit:
  - Creates first admin user in `pl_users`
  - Sets `pl_usermeta` for role (`pl_capabilities: {"administrator": true}`)
  - Seeds all default options into `pl_options`
  - Creates default "Hello World!" post and "Sample Page"
  - Creates default "Uncategorised" category
  - Creates primary navigation menu
  - Writes `PRESSLOAD_INSTALLED=true` to environment (or sets a flag in options)

**Step 4 — Success** (`/install/success`)
- "Pressload has been installed successfully!"
- Button: "Log in to your dashboard →"

### Installer Implementation

```typescript
// app/install/actions.ts

export async function testDatabaseConnection(url: string): Promise<{ success: boolean; error?: string }>
export async function runMigrations(): Promise<{ success: boolean; tables: string[] }>
export async function setupSite(data: SetupData): Promise<{ success: boolean; redirectUrl: string }>

// Middleware: if no pl_options table → redirect to /install
// If pl_options exists but user not logged in → redirect to /admin/login
// middleware.ts handles this check on every request
```

---

## Phase 0 — Foundation Setup
**Goal:** Get the dev environment properly configured and the installer working before writing any feature code.  
**Estimated time:** 1 week

### Tasks

- [ ] **Install and configure Tailwind CSS**
  ```bash
  npm install tailwindcss @tailwindcss/typography postcss autoprefixer
  npx tailwindcss init -p
  ```
  Update `tailwind.config.js` to scan all app/component paths.  
  Replace inline styles in existing layout/pages with Tailwind classes.

- [ ] **Install and configure shadcn/ui**
  ```bash
  npx shadcn@latest init
  ```
  Choose: TypeScript, Tailwind, App Router, `@/components/ui` path.  
  Install initial components: `button`, `input`, `label`, `card`, `dialog`, `dropdown-menu`, `toast`, `badge`, `separator`, `avatar`.

- [ ] **Set up Drizzle ORM + Supabase PostgreSQL**
  ```bash
  npm install drizzle-orm drizzle-kit postgres @types/pg
  ```
  Create `lib/db/index.ts` — connection via `DATABASE_URL` env var.  
  Create `lib/db/schema.ts` — empty file, tables added per phase.  
  Add `drizzle.config.ts` — points to schema and migrations dir.  
  Add scripts to `package.json`: `db:generate`, `db:migrate`, `db:studio`.

- [ ] **Set up NextAuth.js v5**
  ```bash
  npm install next-auth@beta
  ```
  Create `lib/auth/config.ts` with credentials provider (email + password).  
  Create `app/api/auth/[...nextauth]/route.ts`.  
  Add `AUTH_SECRET` to `.env.local`.

- [ ] **Environment setup**
  Create `.env.local.example` with all required variables:
  ```
  DATABASE_URL=
  AUTH_SECRET=
  NEXT_PUBLIC_SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  RESEND_API_KEY=
  NEXT_PUBLIC_APP_URL=
  ```
  Create `lib/env.ts` — validate all required vars at startup (fail fast).

- [ ] **Build the installer** (`app/install/`)
  - Step 1: DB connection test
  - Step 2: Run Drizzle migrations — create all 12 `pl_` tables programmatically
  - Step 3: Site setup form (title, admin email, admin username, password)
  - Step 4: Seed default options, create first admin user, create "Hello World" post, create "Uncategorised" category
  - Step 5: Success screen with login link
  - Middleware guard: if no DB tables → redirect to `/install`

- [ ] **CLAUDE.md**
  Write project-specific CLAUDE.md covering: stack decisions, folder conventions, Drizzle usage patterns, auth middleware pattern, plugin/theme API rules.

- [ ] **Admin shell layout**
  Create `app/(admin)/layout.tsx` — sidebar nav, header, auth guard (redirect to `/signin` if not authenticated).  
  Create placeholder pages for all admin routes (dashboard, posts, pages, media, users, plugins, themes, settings).

- [ ] **Sign in page**
  Create `app/(admin)/signin/page.tsx` — email + password form, NextAuth `signIn()` call, error handling.

---

## Phase 1 — Post & Page CRUD
**Goal:** Admin can create, edit, publish, and delete posts and pages. Public site renders them.  
**Estimated time:** 2–3 weeks

> **Note:** The full database schema is now defined in the "Database Architecture" section above and created by the installer in Phase 0. Phase 1 uses the `pl_posts`, `pl_users`, `pl_postmeta`, and `pl_options` tables that already exist after install.

### Phase 1 — Key Schema Usage

```typescript
// lib/db/schema.ts — ALREADY CREATED BY INSTALLER

export const users = pgTable('pl_users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role:         text('role').notNull().default('subscriber'),
                // administrator | editor | author | contributor | subscriber
  avatar:       text('avatar_url'),
  bio:          text('bio'),
  createdAt:    timestamp('created_at').defaultNow(),
})

export const posts = pgTable('posts', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       text('title').notNull(),
  slug:        text('slug').notNull().unique(),
  content:     jsonb('content'),           // TipTap JSON document
  contentHtml: text('content_html'),       // Rendered HTML for SSR
  excerpt:     text('excerpt'),
  status:      text('status').notNull().default('draft'),
                // draft | published | scheduled | private | trash
  type:        text('type').notNull().default('post'),
                // post | page
  authorId:    uuid('author_id').references(() => users.id),
  featuredImage: text('featured_image_url'),
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
})

export const revisions = pgTable('revisions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  content:   jsonb('content'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const options = pgTable('options', {
  key:       text('key').primaryKey(),
  value:     jsonb('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### Tasks

- [ ] **Verify installer ran** — all 12 `pl_` tables exist, default options seeded, first admin user created.

- [ ] **Post list page** (`/admin/posts`)
  - Table: title, status badge, author, date, actions (edit, trash)
  - Filter by: status (all / draft / published / trash)
  - Search by title
  - Pagination

- [ ] **New/Edit post page** (`/admin/posts/new`, `/admin/posts/[id]`)
  - Title input (auto-generates slug, manually overridable)
  - TipTap block editor (Phase 2 — use simple textarea for now)
  - Sidebar panel: status, publish date, featured image, excerpt
  - Save draft, Publish, Schedule buttons
  - Revision history list (restore button)

- [ ] **Pages** — same as posts, separate route group (`/admin/pages`)

- [ ] **Slug generation** — `lib/utils/slugify.ts` — auto from title, unique check against DB

- [ ] **Public post rendering**
  - `app/(site)/blog/[slug]/page.tsx` — fetch post by slug, render `contentHtml`
  - `app/(site)/[slug]/page.tsx` — static pages
  - `app/(site)/blog/page.tsx` — paginated post archive, 10 per page
  - `app/(site)/page.tsx` — homepage: reads `options.homepage_display` (posts or static page)

- [ ] **Server actions** — use Next.js Server Actions for all CRUD:
  - `createPost()`, `updatePost()`, `deletePost()`, `publishPost()`, `restoreRevision()`

- [ ] **Auth middleware** — `middleware.ts` protects all `/admin/*` routes, redirects to `/signin`

- [ ] **Default admin user** — seed script creates first admin on fresh install

---

## Phase 2 — Block Editor
**Goal:** Replace the textarea with a real block editor. Core blocks working.  
**Estimated time:** 2–3 weeks

### Tasks

- [ ] **Install TipTap**
  ```bash
  npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
  npm install @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
  npm install @tiptap/extension-table @tiptap/extension-code-block-lowlight
  ```

- [ ] **Editor component** (`components/editor/Editor.tsx`)
  - TipTap editor with toolbar
  - Outputs JSON (stored in `posts.content`) + HTML (stored in `posts.content_html`)
  - Toolbar: Bold, Italic, Underline, Strike, H1–H3, Bullet list, Numbered list, Quote, Code block, Link, Image

- [ ] **Core blocks via TipTap extensions:**

  | Block | TipTap Extension |
  |-------|-----------------|
  | Paragraph | Built-in |
  | Heading (H1–H3) | Built-in |
  | Bullet list | Built-in |
  | Numbered list | Built-in |
  | Blockquote | Built-in |
  | Code block | `@tiptap/extension-code-block-lowlight` |
  | Image | `@tiptap/extension-image` (upload to Supabase Storage) |
  | Link | `@tiptap/extension-link` |
  | Table | `@tiptap/extension-table` |
  | Horizontal rule | Built-in |

- [ ] **Image upload in editor**
  - Drag-and-drop or toolbar button
  - Upload to Supabase Storage → get public URL → insert as image node
  - Show upload progress

- [ ] **Autosave** — save draft every 30 seconds while editing (debounced)

- [ ] **Render HTML on public site** — `contentHtml` rendered via `dangerouslySetInnerHTML` with DOMPurify sanitisation

---

## Phase 3 — Media Library
**Goal:** Upload, browse, and insert media. Featured images work.  
**Estimated time:** 1–2 weeks

### Database Schema (Phase 3)

```typescript
export const media = pgTable('media', {
  id:          uuid('id').primaryKey().defaultRandom(),
  filename:    text('filename').notNull(),
  url:         text('url').notNull(),
  mimeType:    text('mime_type').notNull(),
  size:        integer('size').notNull(),         // bytes
  width:       integer('width'),
  height:      integer('height'),
  alt:         text('alt').default(''),
  caption:     text('caption').default(''),
  uploadedBy:  uuid('uploaded_by').references(() => users.id),
  createdAt:   timestamp('created_at').defaultNow(),
})
```

### Tasks

- [ ] **Media library page** (`/admin/media`)
  - Grid view of all uploaded files
  - Filter by type (image / video / document)
  - Search by filename or alt text
  - Click to view details: URL, dimensions, size, alt, caption (editable)
  - Delete media (removes from Supabase Storage + DB)

- [ ] **Upload** — drag-and-drop zone + file picker button, multiple file upload, progress indicators

- [ ] **Supabase Storage integration** — `lib/storage.ts` — upload, get public URL, delete

- [ ] **Featured image picker** — modal that opens the media library, select an image → sets `posts.featured_image`

- [ ] **Image sizes** — on upload, generate thumbnail (300px) and medium (768px) variants using `sharp`

---

## Phase 4 — Taxonomies, Users & Comments
**Goal:** Categories, tags, user management, and comment moderation.  
**Estimated time:** 2 weeks

### Phase 4 — Schema Usage

All taxonomy and comment tables (`pl_terms`, `pl_term_taxonomy`, `pl_term_relationships`, `pl_termmeta`, `pl_comments`, `pl_commentmeta`) are already created by the installer. Phase 4 wires up the admin UI and public rendering against them.

```typescript
// Tables already exist — just showing key fields used in Phase 4

export const terms = pgTable('pl_terms', {
  id:       uuid('id').primaryKey().defaultRandom(),
  name:     text('name').notNull(),
  slug:     text('slug').notNull().unique(),
  type:     text('type').notNull(),     // category | tag | custom
  parentId: uuid('parent_id'),          // hierarchical categories
})

export const postTaxonomies = pgTable('post_taxonomies', {
  postId:      uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  taxonomyId:  uuid('taxonomy_id').references(() => taxonomies.id, { onDelete: 'cascade' }),
})

export const comments = pgTable('comments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  parentId:  uuid('parent_id'),           // threaded replies
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  content:   text('content').notNull(),
  status:    text('status').notNull().default('pending'),
              // pending | approved | spam | trash
  createdAt: timestamp('created_at').defaultNow(),
})
```

### Tasks

- [ ] **Categories & tags** — create, edit, delete, assign to posts in editor sidebar
- [ ] **Archive pages** — `app/(site)/blog/category/[slug]/page.tsx`, `/tag/[slug]/page.tsx`
- [ ] **User management** (`/admin/users`) — list, invite by email, change role, remove
- [ ] **User profile** — edit own name, bio, avatar, password
- [ ] **Comments** (`/admin/comments`) — moderation queue, approve, mark spam, trash, reply
- [ ] **Comment form** on public single post (if enabled in settings)
- [ ] **Email notification** on new comment — Resend to post author

---

## Phase 5 — Settings, Menus & SEO
**Goal:** Core settings, navigation menus, and per-post SEO fields.  
**Estimated time:** 1–2 weeks

### Database Schema (Phase 5)

```typescript
export const menus = pgTable('menus', {
  id:       uuid('id').primaryKey().defaultRandom(),
  name:     text('name').notNull(),
  location: text('location'),       // primary | footer | social
})

export const menuItems = pgTable('menu_items', {
  id:       uuid('id').primaryKey().defaultRandom(),
  menuId:   uuid('menu_id').references(() => menus.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  label:    text('label').notNull(),
  url:      text('url'),
  postId:   uuid('post_id').references(() => posts.id),
  order:    integer('order').notNull().default(0),
})
```

### Tasks

- [ ] **General settings** — site title, tagline, URL, admin email, timezone, language
- [ ] **Reading settings** — homepage display (posts or static page), posts per page
- [ ] **Discussion settings** — enable/disable comments globally, moderation defaults
- [ ] **Permalink settings** — URL structure: `/%year%/%month%/%slug%`, `/%slug%`, etc.
- [ ] **Menus** (`/admin/settings/menus`) — drag-and-drop menu builder, assign to theme locations
- [ ] **Per-post SEO fields** — meta title, meta description, canonical, noindex, OG image
- [ ] **Robots.txt** — dynamically generated at `/robots.txt` from settings
- [ ] **XML sitemap** — auto-generated at `/sitemap.xml` — posts, pages, taxonomies

---

## Phase 6 — Plugin & Theme System
**Goal:** Extensible plugin API and theme template system.  
**Estimated time:** 2–3 weeks

### Plugin Manifest (`pressload.plugin.json`)
```json
{
  "name": "pressload-seo",
  "version": "1.0.0",
  "description": "SEO meta fields and sitemap for Pressload",
  "entry": "./index.ts",
  "adminPages": [
    { "slug": "seo", "label": "SEO", "icon": "search" }
  ]
}
```

### Theme Manifest (`pressload.theme.json`)
```json
{
  "name": "pressload-default",
  "version": "1.0.0",
  "description": "Clean, minimal default theme",
  "locations": ["primary", "footer"],
  "supports": ["featured-image", "custom-logo", "custom-background"],
  "templates": {
    "index": "templates/index.tsx",
    "single": "templates/single.tsx",
    "page": "templates/page.tsx",
    "archive": "templates/archive.tsx",
    "404": "templates/404.tsx"
  }
}
```

### Tasks

- [ ] **Hook system** (`lib/hooks/index.ts`)
  ```typescript
  addAction(hook: string, callback: Function, priority?: number): void
  addFilter(hook: string, callback: Function, priority?: number): void
  doAction(hook: string, ...args: any[]): void
  applyFilters(hook: string, value: any, ...args: any[]): any
  ```

- [ ] **Plugin loader** (`lib/plugins/loader.ts`)
  - Scan `plugins/` directory for `pressload.plugin.json`
  - Load `entry` file, call `register(hooks)` function
  - Register admin menu pages
  - Store active plugins in options table

- [ ] **Theme loader** (`lib/themes/loader.ts`)
  - Read active theme from options
  - Load theme manifest
  - Resolve template files

- [ ] **Plugin management page** (`/admin/plugins`)
  - List installed plugins, activate/deactivate
  - Plugin details: name, version, description

- [ ] **Theme management page** (`/admin/themes`)
  - List installed themes, preview, activate

- [ ] **First-party plugin: `pressload-seo`**
  - Hooks into post save to add SEO meta
  - Admin page for global SEO defaults
  - Generates OG tags and structured data

- [ ] **Default theme: `pressload-default`**
  - Clean, readable typography
  - Responsive
  - Supports featured image, custom logo, primary + footer menus

---

## Phase 7 — REST API
**Goal:** Full REST API — headless-compatible, all content types exposed.  
**Estimated time:** 1–2 weeks

### Endpoints

```
GET    /api/v1/posts              List posts (filter, paginate, sort)
GET    /api/v1/posts/{slug}       Single post by slug
POST   /api/v1/posts              Create post (auth required)
PUT    /api/v1/posts/{id}         Update post (auth required)
DELETE /api/v1/posts/{id}         Delete post (auth required)

GET    /api/v1/pages
GET    /api/v1/pages/{slug}

GET    /api/v1/media
POST   /api/v1/media              Upload file (auth required)

GET    /api/v1/users
GET    /api/v1/users/me           Current user (auth required)

GET    /api/v1/taxonomies
GET    /api/v1/taxonomies/{type}

GET    /api/v1/settings           Public settings only

GET    /api/v1/menus/{location}
```

### Tasks

- [ ] **API authentication** — JWT tokens + API application passwords
- [ ] **Standard response envelope**: `{ data, meta: { total, page, per_page }, error }`
- [ ] **Field selection**: `?fields=id,title,slug,excerpt`
- [ ] **Filtering & sorting**: `?status=published&sort=published_at&order=desc`
- [ ] **Pagination**: `?page=2&per_page=20`
- [ ] **Webhook events**: POST to registered URLs on content create/update/delete

---

## Phase 8 — Polish, Testing & v1.0
**Goal:** Production-ready. Tested. Documented.  
**Estimated time:** 2–3 weeks

### Tasks

- [ ] **Unit tests** (Vitest) — all lib functions, server actions, API handlers. Target: 80%+ coverage
- [ ] **E2E tests** (Playwright) — create post, publish, view on public site; user login/logout; media upload
- [ ] **Lighthouse audit** — target ≥ 90 on public site with default theme
- [ ] **Security review** — CSRF on mutations, XSS on rendered content (DOMPurify), rate limiting on auth routes
- [ ] **CONTRIBUTING.md** — how to write plugins, themes, and contribute to core
- [ ] **CHANGELOG.md** — start tracking from v0.1
- [ ] **README update** — full setup guide, plugin/theme developer docs
- [ ] **GitHub Actions CI** — lint, type check, unit tests, build on every PR
- [ ] **v1.0 release** — tag, GitHub release notes, announcement

---

## Milestone Summary

| Phase | What | Estimated Time | Cumulative |
|-------|------|---------------|------------|
| 0 | Foundation setup + **installer + full DB schema** | 1 week | Week 1 |
| 1 | Post & Page CRUD | 2–3 weeks | Week 4 |
| 2 | Block editor | 2–3 weeks | Week 7 |
| 3 | Media library | 1–2 weeks | Week 9 |
| 4 | Taxonomies, Users, Comments | 2 weeks | Week 11 |
| 5 | Settings, Menus, SEO | 1–2 weeks | Week 13 |
| 6 | Plugin & Theme system | 2–3 weeks | Week 16 |
| 7 | REST API | 1–2 weeks | Week 18 |
| 8 | Polish, Testing, v1.0 | 2–3 weeks | Week 20–21 |

**Total: approximately 5 months to v1.0 at a sustainable solo pace.**

If working full-time on Pressload alone: closer to 3–3.5 months.

---

## First Action Items (Start Here)

1. Install Tailwind CSS and replace existing inline styles
2. Install shadcn/ui and add initial components
3. Set up Supabase project, get `DATABASE_URL`
4. Install Drizzle, write Phase 1 schema, run first migration
5. Install NextAuth v5, build sign-in page, protect `/admin/*` with middleware
6. Build admin shell layout (sidebar, header)
7. Build post list and create/edit pages with a plain textarea editor

**The first commit that matters: a working admin where you can log in, create a post, publish it, and see it on the public site.** Everything else builds on top of that.

---

## Key Decisions Locked In

- **TipTap over building a custom block editor** — saves 6–8 weeks of work, covers 95% of the use case
- **Drizzle over Prisma** — lighter, TypeScript-native, SQL is explicit and readable
- **Supabase Storage over S3** — already using Supabase for DB and auth; no extra vendor
- **Server Actions for mutations** — no separate API layer needed for admin CRUD in v1
- **No Redux/Zustand** — React state + Server Actions + React Query where needed
- **Plugin/theme system deferred to Phase 6** — get core CMS solid first
