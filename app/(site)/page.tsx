export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, users, options } from '@/lib/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'

const PAGE_SIZE = 10

async function getOption(name: string, defaultValue = ''): Promise<string> {
  try {
    const row = await db.query.options.findFirst({
      where: eq(options.optionName, name),
      columns: { optionValue: true },
    })
    return row?.optionValue ?? defaultValue
  } catch {
    return defaultValue
  }
}

export default async function HomePage() {
  let showOnFront: string
  try {
    showOnFront = await getOption('show_on_front', 'posts')
  } catch {
    showOnFront = 'posts'
  }

  if (showOnFront === 'page') {
    const pageOnFrontId = await getOption('page_on_front', '')
    if (pageOnFrontId) {
      const page = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, pageOnFrontId),
          eq(posts.postType, 'page'),
          eq(posts.postStatus, 'publish'),
        ),
      })

      if (page) {
        return (
          <article className="max-w-prose">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">{page.postTitle}</h1>
            </header>
            {page.postContent ? (
              <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: page.postContent }}
              />
            ) : (
              <p className="text-muted-foreground italic">No content yet.</p>
            )}
          </article>
        )
      }
    }
  }

  // Default: show blog archive
  const where = and(eq(posts.postType, 'post'), eq(posts.postStatus, 'publish'))

  const rows = await db
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

  return (
    <section>
      <h1 className="text-3xl font-bold text-foreground mb-8">Latest Posts</h1>

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

      <div className="mt-12">
        <Link href="/blog" className="text-primary hover:underline underline-offset-4">
          View all posts →
        </Link>
      </div>
    </section>
  )
}
