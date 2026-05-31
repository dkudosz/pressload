export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'

const PAGE_SIZE = 10

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10))

  const where = and(eq(posts.postType, 'post'), eq(posts.postStatus, 'publish'))

  const [totalResult, rows] = await Promise.all([
    db.select({ n: count() }).from(posts).where(where),
    db
      .select({
        id: posts.id,
        postTitle: posts.postTitle,
        postExcerpt: posts.postExcerpt,
        postName: posts.postName,
        postDate: posts.postDate,
        authorName: users.displayName,
      })
      .from(posts)
      .leftJoin(users, eq(posts.postAuthor, users.id))
      .where(where)
      .orderBy(desc(posts.postDate))
      .limit(PAGE_SIZE)
      .offset((currentPage - 1) * PAGE_SIZE),
  ])

  const total = Number(totalResult[0]?.n ?? 0)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <section>
      <h1 className="text-3xl font-bold text-foreground mb-8">Blog</h1>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No posts published yet.</p>
      ) : (
        <ul className="space-y-10">
          {rows.map((post) => (
            <li key={post.id}>
              <article>
                <h2 className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
                  <Link href={`/blog/${post.postName}`}>{post.postTitle}</Link>
                </h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {post.postDate && (
                    <time dateTime={post.postDate.toISOString()}>
                      {new Date(post.postDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </time>
                  )}
                  {post.authorName && <span>by {post.authorName}</span>}
                </div>
                {post.postExcerpt && (
                  <p className="mt-2 text-muted-foreground line-clamp-3">{post.postExcerpt}</p>
                )}
                <Link
                  href={`/blog/${post.postName}`}
                  className="inline-block mt-3 text-sm text-primary hover:underline underline-offset-4"
                >
                  Read more →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between mt-12">
          {currentPage > 1 ? (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="text-primary hover:underline underline-offset-4"
            >
              ← Newer posts
            </Link>
          ) : <span />}
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="text-primary hover:underline underline-offset-4"
            >
              Older posts →
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
