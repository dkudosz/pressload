import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, usermeta } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/api/auth'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()

    const user = await db.query.users.findFirst({
      where: eq(users.id, apiUser.id),
    })
    if (!user) return unauthorized()

    const bio = await db.query.usermeta.findFirst({
      where: and(eq(usermeta.userId, apiUser.id), eq(usermeta.metaKey, 'description')),
      columns: { metaValue: true },
    })
    const avatar = await db.query.usermeta.findFirst({
      where: and(eq(usermeta.userId, apiUser.id), eq(usermeta.metaKey, 'avatar_url')),
      columns: { metaValue: true },
    })

    return ok({
      id: user.id,
      name: user.displayName,
      email: user.userEmail,
      login: user.userLogin,
      role: apiUser.role,
      bio: bio?.metaValue ?? '',
      avatar_url: avatar?.metaValue ?? '',
      registered: user.userRegistered?.toISOString() ?? null,
    })
  } catch {
    return serverError()
  }
}
