# Pressload — Claude Code Guide

## What is this project?

Pressload is a WordPress-parity CMS built on Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM, and NextAuth.js v5. It targets developers who want WordPress-like functionality with a modern stack.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL (Supabase) via Drizzle ORM |
| Auth | NextAuth.js v5 (Auth.js) |
| Editor | TipTap (Phase 2) |
| Storage | Supabase Storage (Phase 3) |
| Email | Resend (Phase 4+) |

## Repository Structure

```
app/
  (site)/          Public site routes (homepage, blog, static pages)
  (admin)/
    (protected)/   Auth-protected admin pages (dashboard, posts, etc.)
    signin/        Sign-in page (not auth-protected)
  install/         Installation wizard (4 steps)
  api/
    auth/          NextAuth route handler
components/
  ui/              shadcn/ui components (Button, Input, Card, etc.)
  admin/           Admin-specific components (Sidebar, SignInForm, etc.)
  install/         Installer wizard form components
  site/            Public site components (future)
lib/
  db/
    schema.ts      Drizzle schema (all 12 pl_ tables)
    index.ts       Database connection
  auth/
    config.ts      NextAuth v5 configuration
  env.ts           Environment variable validation (Zod)
  utils.ts         cn() utility for Tailwind class merging
  site-config.ts   Site name/description constants
plugins/           First-party plugins (Phase 6)
themes/            First-party themes (Phase 6)
```

## Drizzle ORM Patterns

### Querying

```typescript
// Always import db from lib/db
import { db } from '@/lib/db'
import { users, posts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// Select with where
const user = await db.query.users.findFirst({
  where: eq(users.userEmail, email),
})

// Insert
const [post] = await db.insert(posts).values({ ... }).returning()

// Update
await db.update(posts)
  .set({ postStatus: 'publish' })
  .where(eq(posts.id, id))

// Delete
await db.delete(posts).where(eq(posts.id, id))
```

### Running migrations

```bash
npm run db:generate   # Generate SQL from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:studio     # Open Drizzle Studio (visual DB browser)
npm run db:push       # Push schema directly (dev only, no migration file)
```

### Schema conventions

- All tables use `pl_` prefix
- UUIDs for primary keys (except bigint identity for meta tables)
- Indexes defined in the table's third argument as an array
- Foreign keys always specify `onDelete: 'cascade'` for child records

## Auth Patterns

### Protecting server components

```typescript
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

const session = await auth()
if (!session) redirect('/signin')
```

### Protecting API routes

```typescript
import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ...
}
```

### Server Actions with auth

```typescript
'use server'
import { auth } from '@/lib/auth/config'

export async function createPost(data: FormData) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  // ...
}
```

Middleware (`middleware.ts`) automatically protects routes listed in `PROTECTED_PATHS`. No need to add auth checks in every layout. Use `auth()` in layouts/pages only when you need session data (e.g., to display user name).

## Tailwind + shadcn/ui

### Color tokens (always use tokens, not raw hex/oklch)

| Token | Usage |
|-------|-------|
| `bg-background` | Page background |
| `bg-card` | Card/surface background |
| `bg-muted` | Subtle background |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/dim text |
| `text-primary` | Accent/link color |
| `border-border` | Default border |

### Component imports

```typescript
// Always import from @/components/ui/...
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
```

### cn() utility — always use for conditional classes

```typescript
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class', className)} />
```

## Plugin & Theme System (Phase 6)

Not yet implemented. See `IMPLEMENTATION_PLAN.md` Phase 6 for the planned hook API (`addAction`, `addFilter`, `doAction`, `applyFilters`) and manifest formats (`pressload.plugin.json`, `pressload.theme.json`).

## Database Table Overview

All 12 `pl_` tables defined in `lib/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `pl_users` | User accounts |
| `pl_usermeta` | Per-user key/value metadata |
| `pl_posts` | All content (posts, pages, attachments, nav) |
| `pl_postmeta` | Per-post key/value metadata |
| `pl_terms` | Category/tag names |
| `pl_term_taxonomy` | Connects terms to taxonomy types |
| `pl_term_relationships` | Posts ↔ terms many-to-many |
| `pl_termmeta` | Per-term metadata |
| `pl_comments` | Post comments (threaded) |
| `pl_commentmeta` | Per-comment metadata |
| `pl_options` | Site-wide settings (like `wp_options`) |
| `pl_links` | Blogroll links (WordPress parity) |

## Environment Variables

Required: `DATABASE_URL`, `AUTH_SECRET`  
Optional: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`

Copy `.env.local.example` to `.env.local` and fill in values. `lib/env.ts` validates them at startup.

## Installation Flow

First-time setup: visit `/install` to run the 4-step wizard:
1. Test database connection
2. Create all 12 `pl_` tables
3. Enter site info + create admin account
4. Success — link to sign in

## Key Rules

- Never commit `.env.local` or secrets
- Use Server Actions for all mutations in admin (no separate API layer needed until Phase 7)
- All admin pages live in `app/(admin)/(protected)/` — middleware + layout both guard them
- All database queries must go through `lib/db` (never create raw connections in components)
- Run `npm run typecheck` before committing
