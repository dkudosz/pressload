/**
 * Simple in-memory sliding-window rate limiter.
 * Works in the Edge runtime (no Node.js APIs).
 * Resets on server restart — acceptable for self-hosted setups.
 * For production at scale, swap the store for Redis/Upstash.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

/** Returns true if the request should be allowed, false if it exceeds the limit. */
export function checkRateLimit(key: string, { limit, windowMs }: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Periodically evict expired entries (every ~5 min)
// Wrapped in try/catch — setInterval may not be available in all Edge builds
try {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
} catch {}
