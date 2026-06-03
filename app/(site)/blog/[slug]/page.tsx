export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, users, terms, termTaxonomy, termRelationships, comments } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { CommentForm } from '@/components/site/comment-form'

interface Props {
  params: Promise<{ slug: string }>
}

interface CommentNode {
  commentId: string
  commentAuthor: string
  commentContent: string
  commentDate: Date | null
  commentParent: string | null
  children: CommentNode[]
}

function buildCommentTree(
  flat: Omit<CommentNode, 'children'>[],
  parentId: string | null,
  depth: number,
): CommentNode[] {
  if (depth > 3) return []
  return flat
    .filter((c) => c.commentParent === parentId)
    .map((c) => ({
      ...c,
      children: buildCommentTree(flat, c.commentId, depth + 1),
    }))
}

function CommentItem({ comment, depth }: { comment: CommentNode; depth: number }) {
  return (
    <div className={depth > 0 ? 'ml-6 pl-4 border-l border-border' : ''}>
      <div className="py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-foreground">{comment.commentAuthor}</span>
          {comment.commentDate && (
            <time className="text-xs text-muted-foreground" dateTime={comment.commentDate.toISOString()}>
              {new Date(comment.commentDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </time>
          )}
        </div>
        <p className="text-sm text-foreground">{comment.commentContent}</p>
      </div>
      {comment.children.map((child) => (
        <CommentItem key={child.commentId} comment={child} depth={depth + 1} />
      ))}
    </div>
  )
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
      commentStatus: posts.commentStatus,
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

  // Fetch taxonomy terms
  const postTerms = await db
    .select({
      name: terms.name,
      slug: terms.slug,
      taxonomy: termTaxonomy.taxonomy,
    })
    .from(termRelationships)
    .innerJoin(termTaxonomy, eq(termRelationships.termTaxonomyId, termTaxonomy.termTaxonomyId))
    .innerJoin(terms, eq(termTaxonomy.termId, terms.termId))
    .where(eq(termRelationships.objectId, post.id))

  const categories = postTerms.filter((t) => t.taxonomy === 'category')
  const tags = postTerms.filter((t) => t.taxonomy === 'post_tag')

  // Fetch approved comments
  const flatComments = await db
    .select({
      commentId: comments.commentId,
      commentAuthor: comments.commentAuthor,
      commentContent: comments.commentContent,
      commentDate: comments.commentDate,
      commentParent: comments.commentParent,
    })
    .from(comments)
    .where(
      and(
        eq(comments.commentPostId, post.id),
        eq(comments.commentApproved, '1'),
      ),
    )
    .orderBy(asc(comments.commentDate))

  const commentTree = buildCommentTree(flatComments, null, 0)

  return (
    <article className="max-w-prose">
      <header className="mb-6">
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

        {/* Categories and tags */}
        {(categories.length > 0 || tags.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/blog/category/${cat.slug}`}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog/tag/${tag.slug}`}
                className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full hover:bg-muted/80 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
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

      {/* Comments section */}
      <section className="mt-12" id="comments">
        <h2 className="text-xl font-bold text-foreground mb-6">
          {flatComments.length > 0
            ? `${flatComments.length} Comment${flatComments.length !== 1 ? 's' : ''}`
            : 'Comments'}
        </h2>

        {commentTree.length > 0 && (
          <div className="divide-y divide-border border rounded-md px-4 mb-8">
            {commentTree.map((comment) => (
              <CommentItem key={comment.commentId} comment={comment} depth={0} />
            ))}
          </div>
        )}

        {post.commentStatus === 'open' ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-muted-foreground">Comments are closed.</p>
        )}
      </section>
    </article>
  )
}
