import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, desc, asc, ilike, or, count } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/api/auth'
import { ok, created, paginated, unauthorized, serverError, badRequest } from '@/lib/api/response'
import { parseQueryParams, selectFields } from '@/lib/api/query'
import { getOption } from '@/lib/options'
import { slugify } from '@/lib/utils/slugify'
import { fireWebhook } from '@/lib/api/webhooks'

function buildPostShape(row: {
  id: string
  postTitle: string
  postName: string
  postContent: string | null
  postExcerpt: string | null
  postStatus: string
  postType: string
  postDate: Date | null
  postModified: Date | null
  displayName: string | null
  authorId: string | null
  guid: string | null
}, siteUrl: string) {
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

export async function GET(req: NextRequest) {
  try {
    const q = parseQueryParams(req.nextUrl.searchParams)
    const apiUser = await authenticateRequest(req)

    const allowedStatuses = apiUser ? ['publish', 'draft', 'pending', 'private'] : ['publish']
    const requestedStatus = q.status && allowedStatuses.includes(q.status)
      ? q.status
      : allowedStatuses[0]

    const where = and(
      eq(posts.postType, 'post'),
      eq(posts.postStatus, requestedStatus),
      q.search
        ? or(
            ilike(posts.postTitle, `%${q.search}%`),
            ilike(posts.postExcerpt, `%${q.search}%`),
          )
        : undefined,
    )

    const [{ total }] = await db.select({ total: count() }).from(posts).where(where)
    const offset = (q.page - 1) * q.perPage
    const orderDir = q.order === 'asc' ? asc : desc
    const orderCol = q.sort === 'title' ? posts.postTitle : posts.postDate

    const rows = await db
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
      .where(where)
      .orderBy(orderDir(orderCol))
      .limit(q.perPage)
      .offset(offset)

    const siteUrl = await getOption('siteurl', '')
    const data = rows.map((r) => selectFields(buildPostShape(r, siteUrl), q.fields))

    return paginated(data, { total, page: q.page, per_page: q.perPage })
  } catch {
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()

    const body = await req.json()
    const title = (body.postTitle as string) ?? ''
    if (!title) return badRequest('postTitle is required')

    const baseSlug = (body.postName as string) || slugify(title) || 'untitled'
    const existing = await db.query.posts.findFirst({
      where: and(eq(posts.postName, baseSlug), eq(posts.postType, 'post')),
      columns: { id: true },
    })
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug
    const siteUrl = await getOption('siteurl', '')

    const [post] = await db
      .insert(posts)
      .values({
        postAuthor: apiUser.id,
        postTitle: title,
        postContent: (body.postContent as string) ?? '',
        postExcerpt: (body.postExcerpt as string) ?? '',
        postName: slug,
        postStatus: (body.postStatus as string) ?? 'draft',
        postType: 'post',
        guid: `${siteUrl}/blog/${slug}`,
      })
      .returning()

    const shape = buildPostShape({
      ...post,
      displayName: null,
      authorId: post.postAuthor,
    }, siteUrl)

    await fireWebhook('post.created', shape)

    return created(shape)
  } catch {
    return serverError()
  }
}
