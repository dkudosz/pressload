import { describe, it, expect, beforeEach } from 'vitest'
import { HookSystem } from '@/lib/hooks'

describe('HookSystem', () => {
  let hooks: HookSystem

  beforeEach(() => {
    hooks = new HookSystem()
  })

  // ── addAction / doAction ──────────────────────────────────────────────────

  it('runs a registered action', () => {
    const calls: unknown[][] = []
    hooks.addAction('my_action', (...args) => calls.push(args))
    hooks.doAction('my_action', 'a', 'b')
    expect(calls).toEqual([['a', 'b']])
  })

  it('runs multiple actions on the same hook', () => {
    const order: number[] = []
    hooks.addAction('hook', () => order.push(1))
    hooks.addAction('hook', () => order.push(2))
    hooks.doAction('hook')
    expect(order).toEqual([1, 2])
  })

  it('respects priority — lower runs first', () => {
    const order: number[] = []
    hooks.addAction('hook', () => order.push(20), 20)
    hooks.addAction('hook', () => order.push(5), 5)
    hooks.addAction('hook', () => order.push(10), 10)
    hooks.doAction('hook')
    expect(order).toEqual([5, 10, 20])
  })

  it('does nothing when no actions registered', () => {
    expect(() => hooks.doAction('nonexistent')).not.toThrow()
  })

  it('hasAction returns false before and true after registration', () => {
    expect(hooks.hasAction('hook')).toBe(false)
    hooks.addAction('hook', () => {})
    expect(hooks.hasAction('hook')).toBe(true)
  })

  it('removeAction stops the callback from firing', () => {
    const calls: number[] = []
    const cb = () => calls.push(1)
    hooks.addAction('hook', cb)
    hooks.removeAction('hook', cb)
    hooks.doAction('hook')
    expect(calls).toHaveLength(0)
  })

  // ── addFilter / applyFilters ──────────────────────────────────────────────

  it('passes value through filter', () => {
    hooks.addFilter('content', (val: unknown) => (val as string) + ' world')
    expect(hooks.applyFilters('content', 'hello')).toBe('hello world')
  })

  it('chains multiple filters in priority order', () => {
    hooks.addFilter('val', (v: unknown) => (v as number) * 10, 10)
    hooks.addFilter('val', (v: unknown) => (v as number) + 1, 5) // runs first
    // start=2 → +1=3 (priority 5) → *10=30 (priority 10)
    expect(hooks.applyFilters('val', 2)).toBe(30)
  })

  it('returns original value when no filters registered', () => {
    expect(hooks.applyFilters('noop', 'original')).toBe('original')
  })

  it('hasFilter returns false before and true after registration', () => {
    expect(hooks.hasFilter('f')).toBe(false)
    hooks.addFilter('f', (v) => v)
    expect(hooks.hasFilter('f')).toBe(true)
  })

  it('removeFilter stops callback from running', () => {
    const cb = (v: unknown) => (v as string) + '!'
    hooks.addFilter('f', cb)
    hooks.removeFilter('f', cb)
    expect(hooks.applyFilters('f', 'hi')).toBe('hi')
  })

  it('does not mutate the original hooks across separate instances', () => {
    const h2 = new HookSystem()
    h2.addAction('shared', () => {})
    expect(hooks.hasAction('shared')).toBe(false)
  })
})
