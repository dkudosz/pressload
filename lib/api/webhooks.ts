import { createHmac } from 'crypto'
import { getOption, updateOption } from '@/lib/options'

export interface WebhookConfig {
  id: string
  url: string
  events: string[]
  secret: string
}

export async function getWebhooks(): Promise<WebhookConfig[]> {
  try {
    const raw = await getOption('webhooks', '[]')
    return JSON.parse(raw) as WebhookConfig[]
  } catch {
    return []
  }
}

export async function registerWebhook(
  url: string,
  events: string[],
  secret = '',
): Promise<WebhookConfig> {
  const hooks = await getWebhooks()
  const config: WebhookConfig = { id: crypto.randomUUID(), url, events, secret }
  hooks.push(config)
  await updateOption('webhooks', JSON.stringify(hooks))
  return config
}

export async function removeWebhook(id: string): Promise<void> {
  const hooks = await getWebhooks()
  await updateOption('webhooks', JSON.stringify(hooks.filter((h) => h.id !== id)))
}

export async function fireWebhook(event: string, data: unknown): Promise<void> {
  let hooks: WebhookConfig[] = []
  try {
    hooks = await getWebhooks()
  } catch {
    return
  }

  const matching = hooks.filter(
    (h) => h.events.includes('*') || h.events.includes(event),
  )
  if (matching.length === 0) return

  const payload = JSON.stringify({ event, data, timestamp: Date.now() })

  for (const hook of matching) {
    const sig = hook.secret
      ? `sha256=${createHmac('sha256', hook.secret).update(payload).digest('hex')}`
      : undefined

    fetch(hook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pressload-Event': event,
        ...(sig ? { 'X-Pressload-Signature': sig } : {}),
      },
      body: payload,
    }).catch(() => {}) // fire-and-forget; never block the request
  }
}
