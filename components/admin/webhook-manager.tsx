'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import type { WebhookConfig } from '@/lib/api/webhooks'
import { useRouter } from 'next/navigation'

async function callApi(method: string, path: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  return res
}

interface Props {
  initialHooks: WebhookConfig[]
}

export function WebhookManager({ initialHooks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState('post.created,post.updated,post.deleted')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add() {
    if (!url.trim()) return
    setError(null)
    startTransition(async () => {
      const evList = events.split(',').map((e) => e.trim()).filter(Boolean)
      const res = await callApi('POST', '/api/v1/webhooks', { url: url.trim(), events: evList, secret: secret.trim() })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Failed to register webhook')
        return
      }
      setUrl(''); setEvents('post.created,post.updated,post.deleted'); setSecret('')
      router.refresh()
    })
  }

  function remove(id: string) {
    if (!confirm('Remove this webhook?')) return
    startTransition(async () => {
      await callApi('DELETE', `/api/v1/webhooks/${id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {initialHooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No webhooks registered yet.</p>
      ) : (
        <div className="space-y-2">
          {initialHooks.map((hook) => (
            <div key={hook.id} className="flex items-start gap-3 p-3 rounded-md border border-border">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-mono text-foreground truncate">{hook.url}</p>
                <div className="flex flex-wrap gap-1">
                  {hook.events.map((ev) => (
                    <Badge key={ev} variant="secondary" className="text-xs font-normal">{ev}</Badge>
                  ))}
                </div>
                {hook.secret && (
                  <p className="text-xs text-muted-foreground">Secret configured</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                disabled={isPending}
                onClick={() => remove(hook.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 pt-3 border-t border-border">
        <p className="text-sm font-medium text-foreground">Add Webhook</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="space-y-2">
          <Label htmlFor="wh-url" className="text-xs">URL</Label>
          <Input
            id="wh-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wh-events" className="text-xs">Events (comma-separated)</Label>
          <Input
            id="wh-events"
            value={events}
            onChange={(e) => setEvents(e.target.value)}
            placeholder="post.created,post.updated"
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wh-secret" className="text-xs">Secret (optional — used for HMAC signature)</Label>
          <Input
            id="wh-secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="my-webhook-secret"
            className="h-8 text-sm"
            type="password"
          />
        </div>
        <Button size="sm" onClick={add} disabled={isPending || !url.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Register Webhook
        </Button>
      </div>
    </div>
  )
}
