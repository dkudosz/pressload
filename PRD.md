# Pressload — Product Requirements Document

**Version:** 1.0  
**Date:** May 2026  
**Status:** Draft  
**Owner:** Damian Kudosz

---

## 1. Overview

### 1.1 Product Summary

Pressload is an open-source content management system (CMS) and website publishing platform built entirely with Next.js (latest App Router). It is a spiritual successor to WordPress — delivering the same core promise of easy website creation, plugin extensibility, and theme customisation — but rebuilt from the ground up on modern web infrastructure.

Pressload targets developers, agencies, and technically-minded content creators who want the power and flexibility of WordPress without PHP, without legacy codebase debt, and without performance overhead.

### 1.2 The Problem

WordPress powers ~43% of the web, but it carries significant baggage:

- Built on PHP in 2003 — the architecture has not fundamentally changed
- Performance is poor by default; significant optimisation required to hit modern Core Web Vitals
- Security vulnerabilities are frequent due to the plugin ecosystem and PHP surface area
- The Gutenberg editor has a poor developer experience
- Hosting is fragmented, complex, and often expensive for small operators
- Modern developers want React, TypeScript, and API-first architecture — WordPress offers none of this natively

### 1.3 The Solution

Pressload reimplements the WordPress feature set on a modern Next.js foundation:

- React-based block editor (like Gutenberg, but well-built)
- API-first content model with a headless-compatible data layer
- Plugin and theme extension system modelled on WordPress hooks and filters
- Self-hostable on any Node.js environment, or deployable to Vercel/Netlify
- Open source under the MIT licence — free forever, community-driven

---

## 2. Goals & Non-Goals

### 2.1 Goals

- Deliver a fully functional CMS with posts, pages, media, users, and settings management
- Provide a visual block editor for creating rich page content without code
- Support a plugin API that allows third-party developers to extend functionality
- Support a theme system that allows visual customisation without touching core code
- Match WordPress's core content model closely enough that migration tooling can be built
- Achieve excellent out-of-the-box performance (Lighthouse score > 90 on all metrics)
- Be fully open source and community-governed

### 2.2 Non-Goals (v1)

- 1:1 PHP WordPress plugin compatibility — Pressload plugins are JavaScript/TypeScript
- Built-in e-commerce (this will be a plugin — `pressload-commerce`)
- Multisite network management (deferred to v2)
- Mobile app (deferred)
- Managed cloud hosting (Pressload is self-hosted; a hosted offering is a separate commercial layer)

---

## 3. Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| Developer / Agency | Builds sites for clients | Familiar CMS with modern DX |
| Content Creator | Manages their own site | Easy editing, no server knowledge |
| Open Source Contributor | Wants to build on or extend Pressload | Clean plugin/theme API, good docs |
| WordPress Migrant | Tired of WP complexity and PHP | Familiar UX, migration path |
| Startup / SaaS | Needs a marketing site + blog | Fast, deployable, owned not rented |

---

## 4. Feature Requirements

### 4.1 Core CMS

#### 4.1.1 Posts & Pages

- Create, edit, publish, unpublish, and delete posts and pages
- Post statuses: Draft, Published, Scheduled, Private, Trash
- Slug management (auto-generated from title, manually overridable)
- Post types: Posts (blog), Pages (static), with extensible custom post types via plugin API
- Categories and tags for posts; hierarchical taxonomies for custom post types
- Featured image support
- Excerpts (manual and auto-generated)
- Revisions history with diff view and restore
- Sticky posts

#### 4.1.2 Block Editor

- Visual, block-based editor (inspired by Gutenberg, built clean)
- Core blocks: Paragraph, Heading, Image, Gallery, List, Quote, Code, Embed, Columns, Button, Separator, Spacer, HTML, Table, Video, Audio
- Block toolbar with formatting controls
- Block patterns: pre-designed block layouts the user can insert
- Full-width and wide-width block alignment options
- Keyboard shortcuts matching standard rich text conventions
- Drag-and-drop block reordering
- Block locking (prevent editing or movement)
- Real-time collaborative editing (v2 target, architecture must support it)

#### 4.1.3 Media Library

- Upload images, video, audio, and documents
- Automatic image resizing to registered sizes
- Alt text, caption, and description metadata
- Search and filter by type, date, uploader
- Drag-and-drop upload
- Storage adapter interface: local filesystem by default, S3/Cloudflare R2 via plugin

#### 4.1.4 Users & Roles

- Built-in roles: Administrator, Editor, Author, Contributor, Subscriber
- Custom roles via plugin API
- Capabilities system (granular permission flags per role)
- User profile: name, bio, avatar, social links
- Password reset via email
- Two-factor authentication (plugin)

#### 4.1.5 Comments

- Comment threads on posts (can be disabled per post or globally)
- Moderation queue: pending, approved, spam, trash
- Nested replies (configurable max depth)
- Email notifications to author on new comment
- Akismet-compatible spam filtering interface

#### 4.1.6 Menus & Navigation

- Create and manage navigation menus
- Assign menus to theme locations
- Menu items: pages, posts, custom URLs, categories
- Drag-and-drop nesting for sub-menus

#### 4.1.7 Widgets & Sidebars

- Widget areas defined by themes
- Core widgets: Recent Posts, Recent Comments, Archives, Categories, Search, Text, RSS
- Custom widgets via plugin API

### 4.2 Plugin System

- Plugin manifest: `pressload.plugin.json` defines name, version, entry point, hooks
- Hook system modelled on WordPress:
  - `addAction(hook, callback, priority)` — execute side effects
  - `addFilter(hook, callback, priority)` — modify data
  - `doAction(hook, ...args)` / `applyFilters(hook, value, ...args)`
- Plugin activation / deactivation lifecycle hooks
- Admin panel menu extensions — plugins can register their own admin pages
- REST API extensions — plugins can add new endpoints
- Block extensions — plugins can register custom blocks
- Plugin settings storage via the options API
- Auto-update mechanism (checks a Pressload plugin registry, like wordpress.org/plugins)

### 4.3 Theme System

- Theme manifest: `pressload.theme.json` defines name, version, supported features, template parts
- Template hierarchy modelled on WordPress (index, single, page, archive, category, etc.)
- Theme customiser: live preview of colour, typography, and layout settings
- Full-site editing (FSE) support: block-based templates editable in the block editor
- Child themes for safe customisation of parent themes
- Theme features: featured images, post formats, custom logo, custom background, custom header
- Theme auto-update mechanism

### 4.4 Settings

- General: site title, tagline, URL, admin email, timezone, date/time formats, language
- Reading: homepage display (latest posts or static page), posts per page, feed settings
- Discussion: comment settings, moderation rules, avatars
- Media: image size registration, uploads path
- Permalinks: configurable URL structure with rewrite rules
- Privacy: privacy policy page assignment, data export/erasure tools (GDPR)

### 4.5 REST API

- Full REST API for all content types (posts, pages, users, media, taxonomies, settings)
- JSON responses, standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Authentication: JWT (default) + application passwords for external integrations
- API versioning: `/api/v1/`
- Pagination, filtering, sorting, field selection on all collection endpoints
- Webhook support: emit events to external URLs on content changes
- Headless-compatible: the frontend can be entirely decoupled and powered by the API

### 4.6 Admin Dashboard

- Activity feed: recent posts, comments, updates
- At-a-glance widgets: post counts, page counts, comment counts
- Quick draft widget
- Site health panel: PHP-equivalent Node.js environment checks, update status
- Update management: core updates, plugin updates, theme updates

### 4.7 SEO (Core)

- Per-post/page: meta title, meta description, canonical URL, noindex toggle
- Open Graph tags: og:title, og:description, og:image, og:type
- Twitter Card tags
- Robots.txt management
- XML sitemap auto-generation (posts, pages, taxonomies, media — configurable)
- Structured data: Article (posts), WebPage (pages), BreadcrumbList
- Schema.org author markup

---

## 5. Technical Requirements

### 5.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (latest, App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix UI primitives) |
| Database | Adaptor-based: SQLite (dev/small), PostgreSQL (production) |
| ORM | Drizzle ORM (lightweight, TypeScript-native) |
| Auth | NextAuth.js v5 (credentials + OAuth providers) |
| File Storage | Local filesystem (default); S3 adapter via plugin |
| Email | Nodemailer (default); Resend/SES via plugin |
| Search | SQLite FTS5 (default); Elasticsearch/OpenSearch via plugin |
| Testing | Vitest (unit), Playwright (e2e) |
| Package manager | npm |
| Linting | ESLint + Prettier |
| CI | GitHub Actions |

### 5.2 Architecture

```
pressload/
├── app/                    # Next.js App Router
│   ├── (site)/             # Public-facing site routes
│   │   ├── page.tsx        # Homepage
│   │   ├── [slug]/         # Pages
│   │   ├── blog/           # Blog index
│   │   └── blog/[slug]/    # Post single
│   └── (admin)/            # Admin dashboard routes (protected)
│       ├── dashboard/
│       ├── posts/
│       ├── pages/
│       ├── media/
│       ├── users/
│       ├── plugins/
│       ├── themes/
│       └── settings/
├── components/
│   ├── editor/             # Block editor components
│   ├── admin/              # Admin UI components
│   └── site/               # Site-facing components
├── lib/
│   ├── api/                # REST API handlers
│   ├── db/                 # Drizzle schema + migrations
│   ├── hooks/              # Plugin hook system
│   ├── plugins/            # Plugin loader
│   ├── themes/             # Theme loader
│   └── auth/               # Auth config
├── plugins/                # First-party plugins (bundled)
│   └── pressload-seo/
├── themes/                 # First-party themes
│   └── pressload-default/
└── public/                 # Static assets
```

### 5.3 Performance Requirements

- Lighthouse Performance score ≥ 90 on default theme homepage
- Time to First Byte (TTFB) < 200ms on self-hosted Node.js
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Admin dashboard: initial load < 3s on average connection
- Block editor: input latency < 50ms (no jank on typing)

### 5.4 Security Requirements

- All admin routes protected by authentication middleware
- CSRF protection on all state-mutating requests
- SQL injection prevention via parameterised queries (Drizzle ORM)
- XSS prevention: no raw `dangerouslySetInnerHTML` without sanitisation (DOMPurify)
- Rate limiting on auth endpoints and REST API
- Content Security Policy headers
- Dependency audit in CI (npm audit)
- OWASP Top 10 compliance checklist before v1 release

### 5.5 Open Source Requirements

- Licence: MIT
- Public GitHub repository
- Contributor guidelines (CONTRIBUTING.md)
- Code of conduct (CODE_OF_CONDUCT.md)
- Semantic versioning (SEMVER)
- Changelog maintained in CHANGELOG.md
- All public APIs documented in `/docs`
- GitHub Discussions for community Q&A
- GitHub Issues for bug tracking
- GitHub Projects board for roadmap visibility

---

## 6. User Stories

### Admin / Developer

- As an admin, I can create and publish a new blog post with the block editor so that it appears on the public site.
- As an admin, I can upload images to the media library and insert them into posts.
- As an admin, I can install a plugin from the plugin browser and activate it without restarting the server.
- As an admin, I can switch themes and preview the change before applying it.
- As an admin, I can manage user accounts, change their roles, and revoke access.
- As an admin, I can configure the site's permalink structure and regenerate rewrites.
- As an admin, I can view and moderate comments, approve or mark them as spam.

### Content Editor

- As an editor, I can create, edit, and publish posts but cannot change site settings.
- As an editor, I can manage all other users' posts (edit, delete, publish).
- As an editor, I can manage the media library.

### Author

- As an author, I can create and manage my own posts but cannot publish them without editor approval.
- As an author, I can upload media for use in my own posts.

### Developer / Plugin Author

- As a plugin developer, I can register custom hooks, filters, and blocks using a documented API.
- As a plugin developer, I can add admin menu pages and REST API endpoints via my plugin.
- As a plugin developer, I can store and retrieve settings via the options API.

### Theme Developer

- As a theme developer, I can define template parts and customiser settings in `pressload.theme.json`.
- As a theme developer, I can register custom block patterns and block styles.

---

## 7. Milestones & Roadmap

### v0.1 — Foundation (Month 1–2)
- Project scaffolding (Next.js, TypeScript, Tailwind, Drizzle, NextAuth)
- Database schema: posts, pages, users, media, options, taxonomies
- Basic admin dashboard layout and navigation
- Auth: login, logout, session management, role middleware
- Post CRUD: create, edit, delete, publish (simple textarea editor)

### v0.2 — Content (Month 2–3)
- Block editor MVP: Paragraph, Heading, Image, List, Quote, Code blocks
- Media library: upload, browse, insert
- Categories and tags
- Permalink system + rewrite rules
- Public site rendering (homepage, single post, page, archive)

### v0.3 — Extensibility (Month 3–4)
- Plugin system: manifest loading, activation/deactivation, hook API
- Theme system: manifest loading, template hierarchy, child themes
- Options API
- First-party SEO plugin (`pressload-seo`)
- Default theme v1 (`pressload-default`)

### v0.4 — Polish (Month 4–5)
- REST API v1 (all core content types)
- Comments system
- Menus management
- Widgets and sidebars
- Customiser (live preview)
- XML sitemap

### v1.0 — Public Release (Month 6)
- Security audit and OWASP review
- Performance audit (Lighthouse ≥ 90)
- Full documentation
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, CHANGELOG.md
- GitHub Discussions enabled
- Plugin and theme developer documentation published
- Announcement: GitHub, Product Hunt, Hacker News, dev.to

### v2.0 (Future)
- Full-site editing (FSE) with block-based templates
- Multisite / network management
- Real-time collaborative editing
- Managed hosting offer (commercial layer on top of open source)

---

## 8. Success Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| GitHub stars | 1,000+ |
| Community contributors | 20+ |
| Plugin ecosystem | 10+ community plugins |
| Open issues resolved | > 80% within 30 days |
| Lighthouse score (default theme) | ≥ 90 |
| Weekly active installs (telemetry opt-in) | 500+ |

---

## 9. Open Questions

1. **Database default**: Should SQLite be the default for ease of setup, with PostgreSQL as the production recommendation? Or lead with PostgreSQL from day one?
2. **Block editor**: Build from scratch, or fork/adapt an existing open-source block editor (e.g. EditorJS, TipTap, Lexical)?
3. **Plugin registry**: Self-hosted registry or leverage npm for plugin distribution?
4. **Theme marketplace**: Community-driven (like wordpress.org/themes) or curated?
5. **Telemetry**: Opt-in anonymous usage telemetry for development prioritisation?
6. **Governance**: Solo maintainer to start, or establish a steering committee early?

---

## 10. Appendix

### 10.1 WordPress Feature Parity Checklist (v1 Target)

| WordPress Feature | Pressload v1 |
|-------------------|--------------|
| Posts & Pages | ✅ |
| Block Editor | ✅ (MVP) |
| Media Library | ✅ |
| Users & Roles | ✅ |
| Comments | ✅ |
| Menus | ✅ |
| Widgets | ✅ (basic) |
| Plugins | ✅ |
| Themes | ✅ |
| REST API | ✅ |
| SEO (Yoast equivalent) | ✅ (first-party plugin) |
| Multisite | ❌ (v2) |
| WooCommerce equivalent | ❌ (v2 plugin) |
| Full Site Editing (FSE) | ⚠️ (partial, v1.x) |
| XML Import/Export | ✅ |
| Auto-updates | ✅ |

### 10.2 References

- [WordPress.org](https://wordpress.org) — feature reference
- [Next.js App Router docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [NextAuth.js v5](https://authjs.dev)
- [shadcn/ui](https://ui.shadcn.com)
