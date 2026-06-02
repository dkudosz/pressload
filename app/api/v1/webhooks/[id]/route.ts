import { type NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth'
import { noContent, unauthorized, serverError } from '@/lib/api/response'
import { removeWebhook } from '@/lib/api/webhooks'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()
    const { id } = await params
    await removeWebhook(id)
    return noContent()
  } catch {
    return serverError()
  }
}
