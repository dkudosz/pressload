export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeHtml } from '@/lib/utils/sanitize'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params

  const result = await db
    .select({
      id: posts.id,
      postTitle: posts.postTitle,
      postContent: posts.postContent,
      postDate: posts.postDate,
      authorName: users.displayName,
    })
    .from(posts)
    .leftJoin(users, eq(posts.postAuthor, users.id))
    .where(
      and(
        eq(posts.postName, slug),
        eq(posts.postType, 'page'),
        eq(posts.postStatus, 'publish'),
      ),
    )
    .limit(1)

  const page = result[0]
  if (!page) notFound()

  return (
    <article className="max-w-prose">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{page.postTitle}</h1>
      </header>

      {page.postContent ? (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.postContent) }}
        />
      ) : (
        <p className="text-muted-foreground italic">No content yet.</p>
      )}
    </article>
  )
}
