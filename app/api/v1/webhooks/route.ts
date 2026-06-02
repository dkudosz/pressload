import { type NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth'
import { ok, created, unauthorized, badRequest, serverError } from '@/lib/api/response'
import { getWebhooks, registerWebhook } from '@/lib/api/webhooks'

export async function GET(req: NextRequest) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()
    return ok(await getWebhooks())
  } catch {
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()

    const body = await req.json()
    const url = body.url as string
    const events = body.events as string[]
    const secret = (body.secret as string) ?? ''

    if (!url) return badRequest('url is required')
    if (!Array.isArray(events) || events.length === 0) return badRequest('events must be a non-empty array')

    const hook = await registerWebhook(url, events, secret)
    return created(hook)
  } catch {
    return serverError()
  }
}
