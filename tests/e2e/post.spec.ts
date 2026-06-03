import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'password'

import type { Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/dashboard/)
}

test.describe('Post management', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('posts list page renders', async ({ page }) => {
    await page.goto('/posts')
    await expect(page.getByRole('heading', { name: /posts/i })).toBeVisible()
  })

  test('create a draft post', async ({ page }) => {
    await page.goto('/posts/new')
    const title = `Test Post ${Date.now()}`
    await page.getByLabel(/title/i).fill(title)
    await page.getByRole('button', { name: /save draft/i }).click()

    // Should redirect to the edit page for the new post
    await page.waitForURL(/\/posts\/[0-9a-f-]{36}/)
    await expect(page.locator(`input[value="${title}"], input:has-text("${title}")`).first()).toBeVisible()
  })

  test('publish a post and verify it appears on public site', async ({ page }) => {
    await page.goto('/posts/new')
    const slug = `e2e-pub-${Date.now()}`
    const title = `E2E Published Post`

    await page.getByLabel(/title/i).fill(title)
    // Wait for slug to auto-fill
    await page.waitForTimeout(300)
    // Override slug to a predictable value
    await page.getByLabel(/slug/i).fill(slug)
    await page.getByRole('button', { name: /publish/i }).click()
    await page.waitForURL(/\/posts\/[0-9a-f-]{36}/)

    // Visit public URL
    await page.goto(`/blog/${slug}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  })

  test('REST API returns published posts', async ({ request }) => {
    const res = await request.get('/api/v1/posts')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
    expect(typeof body.meta.total).toBe('number')
  })

  test('REST API returns 404 for non-existent post', async ({ request }) => {
    const res = await request.get('/api/v1/posts/this-slug-does-not-exist-xyz')
    expect(res.status()).toBe(404)
  })
})
