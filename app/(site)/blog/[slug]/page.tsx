export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeHtml } from '@/lib/utils/sanitize'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const result = await db
    .select({
      id: posts.id,
      postTitle: posts.postTitle,
      postContent: posts.postContent,
      postExcerpt: posts.postExcerpt,
      postDate: posts.postDate,
      authorName: users.displayName,
    })
    .from(posts)
    .leftJoin(users, eq(posts.postAuthor, users.id))
    .where(
      and(
        eq(posts.postName, slug),
        eq(posts.postType, 'post'),
        eq(posts.postStatus, 'publish'),
      ),
    )
    .limit(1)

  const post = result[0]
  if (!post) notFound()

  return (
    <article className="max-w-prose">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{post.postTitle}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          {post.postDate && (
            <time dateTime={post.postDate.toISOString()}>
              {new Date(post.postDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </time>
          )}
          {post.authorName && <span>by {post.authorName}</span>}
        </div>
      </header>

      {post.postContent ? (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.postContent) }}
        />
      ) : (
        <p className="text-muted-foreground italic">No content yet.</p>
      )}

      <footer className="mt-12 pt-6 border-t border-border">
        <Link href="/blog" className="text-primary hover:underline underline-offset-4 text-sm">
          ← Back to blog
        </Link>
      </footer>
    </article>
  )
}
