# Contributing to Pressload

Thank you for your interest in contributing! This guide covers writing plugins, themes, and contributing code to Pressload core.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Writing a Plugin](#writing-a-plugin)
- [Writing a Theme](#writing-a-theme)
- [Contributing Code](#contributing-code)
- [Commit Style](#commit-style)
- [Testing](#testing)

---

## Development Setup

```bash
git clone https://github.com/your-org/pressload.git
cd pressload
cp .env.local.example .env.local
# Fill in DATABASE_URL and AUTH_SECRET
npm install
npm run db:migrate
npm run dev
```

Visit `/install` to set up your local database.

---

## Writing a Plugin

Plugins live in `plugins/<your-plugin-name>/` and need two files:

### 1. `pressload.plugin.json`

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What this plugin does.",
  "author": "Your Name",
  "entry": "./index.js",
  "adminPages": [
    { "slug": "my-plugin", "label": "My Plugin" }
  ]
}
```

### 2. `index.ts`

Export a `register(hooks)` function. This is called at server startup for active plugins.

```typescript
import type { HookSystem } from '@/lib/hooks'

export function register(hooks: HookSystem): void {
  // Filter: modify post JSON-LD schemas
  hooks.addFilter('pressload.post.json_ld', (schemas, ctx) => {
    return [...(schemas as object[]), { '@type': 'MySchema' }]
  })

  // Action: fired after a post is saved (REST API)
  hooks.addAction('pressload.post.save', (postId) => {
    console.log('Post saved:', postId)
  })
}
```

### Available hooks

| Hook | Type | Description |
|------|------|-------------|
| `pressload.post.json_ld` | filter | Array of JSON-LD schemas for a blog post |
| `pressload.content.render` | filter | Rendered HTML content before display |

To **activate** your plugin, go to **Admin → Plugins** and click Activate. Restart the dev server for hooks to take effect.

---

## Writing a Theme

Themes live in `themes/<your-theme-name>/` and need a manifest:

### `pressload.theme.json`

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "description": "My custom theme.",
  "author": "Your Name",
  "locations": ["primary", "footer"],
  "supports": ["featured-image", "custom-logo"],
  "templates": {
    "index": "templates/index",
    "single": "templates/single",
    "page": "templates/page",
    "archive": "templates/archive",
    "404": "templates/404"
  }
}
```

To **activate** your theme, go to **Admin → Themes** and click Activate. The site header and any theme-aware components will use your theme's configuration immediately.

---

## Contributing Code

1. **Fork** the repository and create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes following the conventions in `CLAUDE.md`
3. Run `npm run typecheck` — must pass with zero errors
4. Run `npm run test:unit` — all tests must pass
5. Add tests for any new pure functions in `lib/`
6. Open a **Pull Request** against `main`

### Branch naming

| Type | Pattern |
|------|---------|
| Feature | `feat/short-description` |
| Bug fix | `fix/short-description` |
| Docs | `docs/short-description` |
| Refactor | `refactor/short-description` |

---

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add X
fix(scope): resolve Y
docs: update CONTRIBUTING
refactor(lib): simplify hook system
test: add slugify edge cases
```

---

## Testing

```bash
npm run typecheck       # TypeScript — zero errors required
npm run lint            # ESLint
npm run test:unit       # Vitest unit tests
npm run test:coverage   # With coverage report
npm run test:e2e        # Playwright E2E (requires running app + DB)
```

All PRs must pass typecheck, lint, and unit tests in CI before merging.
