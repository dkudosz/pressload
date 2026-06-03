import { describe, it, expect } from 'vitest'
import { slugify } from '@/lib/utils/slugify'

describe('slugify', () => {
  it('lowercases the input', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('my blog post')).toBe('my-blog-post')
  })

  it('removes special characters', () => {
    expect(slugify('Hello, World! & More?')).toBe('hello-world-more')
  })

  it('collapses consecutive hyphens', () => {
    expect(slugify('one  --  two')).toBe('one-two')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -hello- ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('handles only special characters', () => {
    expect(slugify('!@#$%')).toBe('')
  })

  it('preserves numbers', () => {
    expect(slugify('Phase 2 Update')).toBe('phase-2-update')
  })

  it('handles underscores (treated as word chars, then collapsed)', () => {
    expect(slugify('hello_world')).toBe('hello-world')
  })
})
