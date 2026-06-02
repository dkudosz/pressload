export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, users, terms, termTaxonomy, termRelationships } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TagArchivePage({ params }: Props) {
  const { slug } = await params

  const term = await db
    .select({
      name: terms.name,
      termTaxonomyId: termTaxonomy.termTaxonomyId,
    })
    .from(terms)
    .innerJoin(termTaxonomy, eq(termTaxonomy.termId, terms.termId))
    .where(and(eq(terms.slug, slug), eq(termTaxonomy.taxonomy, 'post_tag')))
    .limit(1)

  if (!term[0]) notFound()

  const { name, termTaxonomyId } = term[0]

  const postList = await db
    .select({
      id: posts.id,
      postTitle: posts.postTitle,
      postName: posts.postName,
      postDate: posts.postDate,
      postExcerpt: posts.postExcerpt,
      authorName: users.displayName,
    })
    .from(termRelationships)
    .innerJoin(posts, eq(termRelationships.objectId, posts.id))
    .leftJoin(users, eq(posts.postAuthor, users.id))
    .where(
      and(
        eq(termRelationships.termTaxonomyId, termTaxonomyId),
        eq(posts.postType, 'post'),
        eq(posts.postStatus, 'publish'),
      ),
    )
    .orderBy(desc(posts.postDate))

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Tag</p>
        <h1 className="text-3xl font-bold text-foreground">{name}</h1>
      </header>

      {postList.length === 0 ? (
        <p className="text-muted-foreground">No posts with this tag yet.</p>
      ) : (
        <div className="space-y-6">
          {postList.map((post) => (
            <article key={post.id} className="space-y-1">
              <h2 className="text-lg font-semibold">
                <Link href={`/blog/${post.postName}`} className="text-foreground hover:text-primary transition-colors">
                  {post.postTitle}
                </Link>
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {post.postDate && (
                  <time dateTime={post.postDate.toISOString()}>
                    {new Date(post.postDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                )}
                {post.authorName && <span>by {post.authorName}</span>}
              </div>
              {post.postExcerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2">{post.postExcerpt}</p>
              )}
            </article>
          ))}
        </div>
      )}

      <Link href="/blog" className="text-primary hover:underline underline-offset-4 text-sm">
        ← All posts
      </Link>
    </div>
  )
}
