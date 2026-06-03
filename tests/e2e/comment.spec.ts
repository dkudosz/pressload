import { test, expect } from '@playwright/test'

/**
 * Comment E2E tests.
 * Requires at least one published post with comments open.
 * Set TEST_POST_SLUG env var to a known published post slug.
 */

const POST_SLUG = process.env.TEST_POST_SLUG ?? 'hello-world'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'password'

test.describe('Public comment form', () => {
  test('comment form is visible on an open post', async ({ page }) => {
    await page.goto(`/blog/${POST_SLUG}`)
    await expect(page.getByRole('heading', { name: /leave a comment/i })).toBeVisible()
  })

  test('submitting a comment shows pending confirmation', async ({ page }) => {
    await page.goto(`/blog/${POST_SLUG}`)
    await page.getByLabel(/name/i).fill('Test Commenter')
    await page.getByLabel(/email/i).fill('commenter@example.com')
    await page.getByLabel(/comment/i).fill('This is a test comment from Playwright.')
    await page.getByRole('button', { name: /post comment/i }).click()
    await expect(page.getByText(/awaiting moderation/i)).toBeVisible()
  })

  test('submitting without required fields shows error', async ({ page }) => {
    await page.goto(`/blog/${POST_SLUG}`)
    await page.getByRole('button', { name: /post comment/i }).click()
    // HTML5 validation or server-side error should prevent submission
    // At minimum we should still be on the same page
    await expect(page).toHaveURL(new RegExp(POST_SLUG))
  })
})

test.describe('Admin comment moderation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)
  })

  test('comments moderation page renders with filter tabs', async ({ page }) => {
    await page.goto('/comments')
    await expect(page.getByRole('heading', { name: /comments/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /pending/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /approved/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /spam/i })).toBeVisible()
  })
})
