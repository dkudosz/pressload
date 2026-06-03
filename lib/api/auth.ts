import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { usermeta, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'crypto'

export interface ApiUser {
  id: string
  email: string
  name: string
  role: string
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export async function authenticateRequest(req: NextRequest): Promise<ApiUser | null> {
  // 1. Bearer token (API key)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7).trim()
    const hash = hashKey(key)
    const meta = await db.query.usermeta.findFirst({
      where: and(eq(usermeta.metaKey, 'api_key_hash'), eq(usermeta.metaValue, hash)),
      columns: { userId: true },
    })
    if (meta) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, meta.userId),
        columns: { id: true, userEmail: true, displayName: true },
      })
      if (user) {
        const roleMeta = await db.query.usermeta.findFirst({
          where: and(eq(usermeta.userId, meta.userId), eq(usermeta.metaKey, 'pl_user_role')),
          columns: { metaValue: true },
        })
        return {
          id: user.id,
          email: user.userEmail,
          name: user.displayName,
          role: roleMeta?.metaValue ?? 'subscriber',
        }
      }
    }
  }

  // 2. NextAuth session cookie
  const session = await auth()
  if (session?.user?.id) {
    const meta = await db.query.usermeta.findFirst({
      where: and(
        eq(usermeta.userId, session.user.id),
        eq(usermeta.metaKey, 'pl_user_role'),
      ),
      columns: { metaValue: true },
    })
    return {
      id: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? '',
      role: meta?.metaValue ?? 'subscriber',
    }
  }

  return null
}

export function isAdminRole(role: string): boolean {
  return role === 'administrator' || role === 'editor'
}
