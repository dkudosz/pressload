import { describe, it, expect } from 'vitest'
import { parseQueryParams, selectFields } from '@/lib/api/query'

function params(obj: Record<string, string>) {
  return new URLSearchParams(obj)
}

describe('parseQueryParams', () => {
  it('returns defaults when no params provided', () => {
    const q = parseQueryParams(new URLSearchParams())
    expect(q.page).toBe(1)
    expect(q.perPage).toBe(10)
    expect(q.fields).toBeNull()
    expect(q.sort).toBe('date')
    expect(q.order).toBe('desc')
    expect(q.status).toBeNull()
    expect(q.search).toBeNull()
  })

  it('parses page and per_page', () => {
    const q = parseQueryParams(params({ page: '3', per_page: '25' }))
    expect(q.page).toBe(3)
    expect(q.perPage).toBe(25)
  })

  it('clamps per_page to max 100', () => {
    const q = parseQueryParams(params({ per_page: '999' }))
    expect(q.perPage).toBe(100)
  })

  it('clamps per_page to min 1', () => {
    const q = parseQueryParams(params({ per_page: '0' }))
    expect(q.perPage).toBe(1)
  })

  it('clamps page to min 1', () => {
    const q = parseQueryParams(params({ page: '-5' }))
    expect(q.page).toBe(1)
  })

  it('parses fields as array', () => {
    const q = parseQueryParams(params({ fields: 'id,title,slug' }))
    expect(q.fields).toEqual(['id', 'title', 'slug'])
  })

  it('trims whitespace from field names', () => {
    const q = parseQueryParams(params({ fields: ' id , title ' }))
    expect(q.fields).toEqual(['id', 'title'])
  })

  it('parses order=asc correctly', () => {
    const q = parseQueryParams(params({ order: 'asc' }))
    expect(q.order).toBe('asc')
  })

  it('defaults unknown order to desc', () => {
    const q = parseQueryParams(params({ order: 'random' }))
    expect(q.order).toBe('desc')
  })

  it('parses status and search', () => {
    const q = parseQueryParams(params({ status: 'draft', search: 'hello' }))
    expect(q.status).toBe('draft')
    expect(q.search).toBe('hello')
  })
})

describe('selectFields', () => {
  const obj = { id: '1', title: 'Post', slug: 'post', content: 'Long...' }

  it('returns full object when fields is null', () => {
    expect(selectFields(obj, null)).toEqual(obj)
  })

  it('returns full object when fields is empty', () => {
    expect(selectFields(obj, [])).toEqual(obj)
  })

  it('returns only requested fields', () => {
    expect(selectFields(obj, ['id', 'title'])).toEqual({ id: '1', title: 'Post' })
  })

  it('ignores unknown field names', () => {
    expect(selectFields(obj, ['id', 'nonexistent'])).toEqual({ id: '1' })
  })

  it('returns empty object when no fields match', () => {
    expect(selectFields(obj, ['nope', 'also_nope'])).toEqual({})
  })
})
