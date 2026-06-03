import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/api/auth'
import { ok, notFound, serverError } from '@/lib/api/response'
import { getOption } from '@/lib/options'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const apiUser = await authenticateRequest(req)
    const statusFilter = apiUser ? undefined : eq(posts.postStatus, 'publish')

    const result = await db
      .select({
        id: posts.id,
        postTitle: posts.postTitle,
        postName: posts.postName,
        postContent: posts.postContent,
        postExcerpt: posts.postExcerpt,
        postStatus: posts.postStatus,
        postDate: posts.postDate,
        postModified: posts.postModified,
        authorId: posts.postAuthor,
        displayName: users.displayName,
      })
      .from(posts)
      .leftJoin(users, eq(posts.postAuthor, users.id))
      .where(and(eq(posts.postName, slug), eq(posts.postType, 'page'), statusFilter))
      .limit(1)

    const page = result[0]
    if (!page) return notFound('Page')

    const siteUrl = await getOption('siteurl', '')
    return ok({
      id: page.id,
      title: page.postTitle,
      slug: page.postName,
      content: page.postContent ?? '',
      excerpt: page.postExcerpt ?? '',
      status: page.postStatus,
      date: page.postDate?.toISOString() ?? null,
      modified: page.postModified?.toISOString() ?? null,
      author: page.authorId ? { id: page.authorId, name: page.displayName ?? '' } : null,
      link: `${siteUrl}/${page.postName}`,
    })
  } catch {
    return serverError()
  }
}
