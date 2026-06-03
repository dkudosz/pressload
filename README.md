# Pressload

An open-source CMS and website publishing platform built on Next.js — a modern, TypeScript-native spiritual successor to WordPress.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL via Supabase — Drizzle ORM
- **Auth:** NextAuth.js v5 (credentials + OAuth)
- **Editor:** TipTap (Phase 2)
- **Storage:** Supabase Storage (Phase 3)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
- `DATABASE_URL` — PostgreSQL connection string (Supabase recommended)
- `AUTH_SECRET` — random secret (generate with `openssl rand -base64 32`)

### 3. Run the installer

Start the dev server and visit `/install`:

```bash
npm run dev
```

Open [http://localhost:3000/install](http://localhost:3000/install) to run the setup wizard. It will:
1. Test your database connection
2. Create all 12 database tables
3. Set up your site and admin account
4. Redirect you to sign in

### 4. Sign in to your dashboard

After install, go to [http://localhost:3000/signin](http://localhost:3000/signin).

## Database Commands

```bash
npm run db:generate   # Generate migration SQL from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:studio     # Open Drizzle Studio (visual DB browser)
npm run db:push       # Push schema directly (dev only)
```

## Project Structure

```
app/
  (site)/       Public-facing site
  (admin)/
    (protected)/ Auth-guarded admin dashboard
    signin/      Login page
  install/      Setup wizard
components/
  ui/           shadcn/ui components
  admin/        Admin shell components
  install/      Installer form components
lib/
  db/           Drizzle schema + DB connection
  auth/         NextAuth config
  env.ts        Environment validation
  utils.ts      Tailwind class utility
```

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Foundation (Tailwind, Drizzle, Auth, Installer, Admin shell) | ✅ Done |
| 1 | Post & Page CRUD | Planned |
| 2 | Block editor (TipTap) | Planned |
| 3 | Media library | Planned |
| 4 | Taxonomies, Users, Comments | Planned |
| 5 | Settings, Menus, SEO | Planned |
| 6 | Plugin & Theme system | Planned |
| 7 | REST API | Planned |
| 8 | Polish, Testing, v1.0 | Planned |

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for full details.

## Licence

MIT
