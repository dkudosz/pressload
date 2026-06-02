import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/api/auth'
import { ok, noContent, unauthorized, notFound, badRequest, serverError } from '@/lib/api/response'
import { getOption } from '@/lib/options'
import { fireWebhook } from '@/lib/api/webhooks'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function findPost(identifier: string, authenticated: boolean) {
  const isUuid = UUID_RE.test(identifier)
  const statusFilter = authenticated
    ? undefined
    : eq(posts.postStatus, 'publish')

  if (isUuid) {
    return db
      .select({
        id: posts.id,
        postTitle: posts.postTitle,
        postName: posts.postName,
        postContent: posts.postContent,
        postExcerpt: posts.postExcerpt,
        postStatus: posts.postStatus,
        postType: posts.postType,
        postDate: posts.postDate,
        postModified: posts.postModified,
        authorId: posts.postAuthor,
        displayName: users.displayName,
        guid: posts.guid,
      })
      .from(posts)
      .leftJoin(users, eq(posts.postAuthor, users.id))
      .where(and(eq(posts.id, identifier), eq(posts.postType, 'post'), statusFilter))
      .limit(1)
      .then((r) => r[0] ?? null)
  }

  return db
    .select({
      id: posts.id,
      postTitle: posts.postTitle,
      postName: posts.postName,
      postContent: posts.postContent,
      postExcerpt: posts.postExcerpt,
      postStatus: posts.postStatus,
      postType: posts.postType,
      postDate: posts.postDate,
      postModified: posts.postModified,
      authorId: posts.postAuthor,
      displayName: users.displayName,
      guid: posts.guid,
    })
    .from(posts)
    .leftJoin(users, eq(posts.postAuthor, users.id))
    .where(and(eq(posts.postName, identifier), eq(posts.postType, 'post'), statusFilter))
    .limit(1)
    .then((r) => r[0] ?? null)
}

function shape(row: NonNullable<Awaited<ReturnType<typeof findPost>>>, siteUrl: string) {
  return {
    id: row.id,
    title: row.postTitle,
    slug: row.postName,
    content: row.postContent ?? '',
    excerpt: row.postExcerpt ?? '',
    status: row.postStatus,
    type: row.postType,
    date: row.postDate?.toISOString() ?? null,
    modified: row.postModified?.toISOString() ?? null,
    author: row.authorId ? { id: row.authorId, name: row.displayName ?? '' } : null,
    link: `${siteUrl}/blog/${row.postName}`,
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const apiUser = await authenticateRequest(req)
    const post = await findPost(id, !!apiUser)
    if (!post) return notFound('Post')
    const siteUrl = await getOption('siteurl', '')
    return ok(shape(post, siteUrl))
  } catch {
    return serverError()
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()

    const { id } = await params
    if (!UUID_RE.test(id)) return badRequest('id must be a UUID for updates')

    const existing = await db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.postType, 'post')),
      columns: { id: true, postName: true },
    })
    if (!existing) return notFound('Post')

    const body = await req.json()
    const updates: Record<string, unknown> = { postModified: new Date(), postModifiedGmt: new Date() }
    if (body.postTitle !== undefined) updates.postTitle = body.postTitle
    if (body.postContent !== undefined) updates.postContent = body.postContent
    if (body.postExcerpt !== undefined) updates.postExcerpt = body.postExcerpt
    if (body.postStatus !== undefined) updates.postStatus = body.postStatus
    if (body.postName !== undefined) updates.postName = body.postName

    await db.update(posts).set(updates).where(eq(posts.id, id))

    const post = await findPost(id, true)
    if (!post) return notFound('Post')
    const siteUrl = await getOption('siteurl', '')
    const result = shape(post, siteUrl)
    await fireWebhook('post.updated', result)
    return ok(result)
  } catch {
    return serverError()
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()

    const { id } = await params
    if (!UUID_RE.test(id)) return badRequest('id must be a UUID')

    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.postType, 'post')),
      columns: { id: true, postStatus: true, postName: true },
    })
    if (!post) return notFound('Post')

    if (post.postStatus === 'trash') {
      await db.delete(posts).where(eq(posts.id, id))
    } else {
      await db.update(posts).set({ postStatus: 'trash' }).where(eq(posts.id, id))
    }

    await fireWebhook('post.deleted', { id, slug: post.postName })
    return noContent()
  } catch {
    return serverError()
  }
}
