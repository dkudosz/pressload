import { describe, it, expect } from 'vitest'
import { ok, created, paginated, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'

async function json(res: Response) {
  return res.json()
}

describe('API response helpers', () => {
  describe('ok', () => {
    it('returns 200 with data wrapper', async () => {
      const res = ok({ id: 1 })
      expect(res.status).toBe(200)
      expect(await json(res)).toEqual({ data: { id: 1 } })
    })
  })

  describe('created', () => {
    it('returns 201 with data wrapper', async () => {
      const res = created({ id: 'new' })
      expect(res.status).toBe(201)
      expect(await json(res)).toEqual({ data: { id: 'new' } })
    })
  })

  describe('paginated', () => {
    it('returns 200 with data + meta + total_pages', async () => {
      const res = paginated([1, 2, 3], { total: 30, page: 2, per_page: 3 })
      expect(res.status).toBe(200)
      const body = await json(res)
      expect(body.data).toEqual([1, 2, 3])
      expect(body.meta.total).toBe(30)
      expect(body.meta.page).toBe(2)
      expect(body.meta.per_page).toBe(3)
      expect(body.meta.total_pages).toBe(10)
    })

    it('calculates total_pages correctly with remainder', async () => {
      const body = await json(paginated([], { total: 11, page: 1, per_page: 5 }))
      expect(body.meta.total_pages).toBe(3)
    })
  })

  describe('error helpers', () => {
    it('badRequest returns 400', async () => {
      const res = badRequest('invalid input')
      expect(res.status).toBe(400)
      expect(await json(res)).toEqual({ error: 'invalid input' })
    })

    it('unauthorized returns 401', async () => {
      expect(unauthorized().status).toBe(401)
    })

    it('forbidden returns 403', async () => {
      expect(forbidden().status).toBe(403)
    })

    it('notFound returns 404 with resource name', async () => {
      const res = notFound('Post')
      expect(res.status).toBe(404)
      expect((await json(res)).error).toContain('Post')
    })

    it('serverError returns 500', async () => {
      expect(serverError().status).toBe(500)
    })
  })
})
