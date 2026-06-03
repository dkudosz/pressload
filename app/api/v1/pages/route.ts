import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/api/auth'
import { paginated, serverError } from '@/lib/api/response'
import { parseQueryParams, selectFields } from '@/lib/api/query'
import { getOption } from '@/lib/options'

export async function GET(req: NextRequest) {
  try {
    const q = parseQueryParams(req.nextUrl.searchParams)
    const apiUser = await authenticateRequest(req)
    const statusFilter = apiUser ? eq(posts.postStatus, q.status ?? 'publish') : eq(posts.postStatus, 'publish')
    const where = and(eq(posts.postType, 'page'), statusFilter)

    const [{ total }] = await db.select({ total: count() }).from(posts).where(where)
    const offset = (q.page - 1) * q.perPage

    const rows = await db
      .select({
        id: posts.id,
        postTitle: posts.postTitle,
        postName: posts.postName,
        postExcerpt: posts.postExcerpt,
        postStatus: posts.postStatus,
        postDate: posts.postDate,
        postModified: posts.postModified,
        authorId: posts.postAuthor,
        displayName: users.displayName,
      })
      .from(posts)
      .leftJoin(users, eq(posts.postAuthor, users.id))
      .where(where)
      .orderBy(desc(posts.postDate))
      .limit(q.perPage)
      .offset(offset)

    const siteUrl = await getOption('siteurl', '')
    const data = rows.map((r) =>
      selectFields(
        {
          id: r.id,
          title: r.postTitle,
          slug: r.postName,
          excerpt: r.postExcerpt ?? '',
          status: r.postStatus,
          date: r.postDate?.toISOString() ?? null,
          modified: r.postModified?.toISOString() ?? null,
          author: r.authorId ? { id: r.authorId, name: r.displayName ?? '' } : null,
          link: `${siteUrl}/${r.postName}`,
        },
        q.fields,
      ),
    )

    return paginated(data, { total, page: q.page, per_page: q.perPage })
  } catch {
    return serverError()
  }
}
