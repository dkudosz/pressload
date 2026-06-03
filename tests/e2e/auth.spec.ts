import { test, expect } from '@playwright/test'

/**
 * Authentication E2E tests.
 * Prerequisites: app running with a seeded database (at least one admin user).
 * Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'password'

test.describe('Authentication', () => {
  test('redirects unauthenticated users from admin to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/signin/)
  })

  test('sign in with valid credentials and reach dashboard', async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Should remain on signin page
    await expect(page).toHaveURL(/\/signin/)
    await expect(page.locator('[data-slot="alert"], .text-destructive').first()).toBeVisible()
  })

  test('sign out returns to sign-in page', async ({ page }) => {
    // Sign in first
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)

    // Sign out via sidebar button
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/signin/)
  })

  test('authenticated users are redirected away from sign-in', async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)

    // Visit signin again — should redirect to dashboard
    await page.goto('/signin')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
