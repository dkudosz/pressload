import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, usermeta } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { authenticateRequest, isAdminRole } from '@/lib/api/auth'
import { paginated, forbidden, unauthorized, serverError } from '@/lib/api/response'
import { parseQueryParams } from '@/lib/api/query'

export async function GET(req: NextRequest) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()
    if (!isAdminRole(apiUser.role)) return forbidden()

    const q = parseQueryParams(req.nextUrl.searchParams)
    const [{ total }] = await db.select({ total: count() }).from(users)

    const rows = await db.query.users.findMany({
      orderBy: (u, { desc }) => [desc(u.userRegistered)],
      limit: q.perPage,
      offset: (q.page - 1) * q.perPage,
    })

    const data = await Promise.all(
      rows.map(async (u) => {
        const roleMeta = await db.query.usermeta.findFirst({
          where: and(eq(usermeta.userId, u.id), eq(usermeta.metaKey, 'pl_user_role')),
          columns: { metaValue: true },
        })
        return {
          id: u.id,
          name: u.displayName,
          email: u.userEmail,
          login: u.userLogin,
          role: roleMeta?.metaValue ?? 'subscriber',
          registered: u.userRegistered?.toISOString() ?? null,
        }
      }),
    )

    return paginated(data, { total, page: q.page, per_page: q.perPage })
  } catch {
    return serverError()
  }
}
