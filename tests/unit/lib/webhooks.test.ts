import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock options module before importing webhooks
vi.mock('@/lib/options', () => ({
  getOption: vi.fn(),
  updateOption: vi.fn(),
}))

import { getWebhooks, registerWebhook, removeWebhook } from '@/lib/api/webhooks'
import { getOption, updateOption } from '@/lib/options'

const mockGetOption = vi.mocked(getOption)
const mockUpdateOption = vi.mocked(updateOption)

describe('webhook config management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWebhooks', () => {
    it('returns empty array when no webhooks stored', async () => {
      mockGetOption.mockResolvedValue('[]')
      expect(await getWebhooks()).toEqual([])
    })

    it('parses stored webhooks correctly', async () => {
      const hooks = [{ id: 'abc', url: 'https://example.com', events: ['post.created'], secret: '' }]
      mockGetOption.mockResolvedValue(JSON.stringify(hooks))
      expect(await getWebhooks()).toEqual(hooks)
    })

    it('returns empty array on JSON parse error', async () => {
      mockGetOption.mockResolvedValue('not-valid-json')
      expect(await getWebhooks()).toEqual([])
    })
  })

  describe('registerWebhook', () => {
    it('adds a new webhook and saves it', async () => {
      mockGetOption.mockResolvedValue('[]')
      const hook = await registerWebhook('https://example.com/hook', ['post.created'])
      expect(hook.url).toBe('https://example.com/hook')
      expect(hook.events).toEqual(['post.created'])
      expect(hook.id).toBeDefined()
      expect(mockUpdateOption).toHaveBeenCalledOnce()
    })

    it('appends to existing webhooks', async () => {
      const existing = [{ id: 'x1', url: 'https://a.com', events: ['*'], secret: '' }]
      mockGetOption.mockResolvedValue(JSON.stringify(existing))
      await registerWebhook('https://b.com', ['post.updated'])
      const saved = JSON.parse(mockUpdateOption.mock.calls[0][1] as string)
      expect(saved).toHaveLength(2)
    })
  })

  describe('removeWebhook', () => {
    it('removes the matching webhook by id', async () => {
      const hooks = [
        { id: 'del-me', url: 'https://a.com', events: ['*'], secret: '' },
        { id: 'keep',   url: 'https://b.com', events: ['*'], secret: '' },
      ]
      mockGetOption.mockResolvedValue(JSON.stringify(hooks))
      await removeWebhook('del-me')
      const saved = JSON.parse(mockUpdateOption.mock.calls[0][1] as string)
      expect(saved).toHaveLength(1)
      expect(saved[0].id).toBe('keep')
    })

    it('is a no-op if id does not exist', async () => {
      const hooks = [{ id: 'keep', url: 'https://a.com', events: ['*'], secret: '' }]
      mockGetOption.mockResolvedValue(JSON.stringify(hooks))
      await removeWebhook('nonexistent')
      const saved = JSON.parse(mockUpdateOption.mock.calls[0][1] as string)
      expect(saved).toHaveLength(1)
    })
  })
})
