import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { PostForm } from '@/components/admin/post-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.postType, 'post')),
  })

  if (!post) notFound()

  const revisions = await db.query.posts.findMany({
    where: and(eq(posts.postParent, id), eq(posts.postType, 'revision')),
    columns: { id: true, postTitle: true, postDate: true },
    orderBy: [desc(posts.postDate)],
    limit: 20,
  })

  return (
    <PostForm
      postType="post"
      post={{
        id: post.id,
        postTitle: post.postTitle,
        postContent: post.postContent,
        postContentJson: post.postContentJson,
        postExcerpt: post.postExcerpt,
        postName: post.postName,
        postStatus: post.postStatus,
        postDate: post.postDate,
      }}
      revisions={revisions}
    />
  )
}
