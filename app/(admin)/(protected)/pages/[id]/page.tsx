import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { PostForm } from '@/components/admin/post-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPagePage({ params }: Props) {
  const { id } = await params

  const page = await db.query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.postType, 'page')),
  })

  if (!page) notFound()

  const revisions = await db.query.posts.findMany({
    where: and(eq(posts.postParent, id), eq(posts.postType, 'revision')),
    columns: { id: true, postTitle: true, postDate: true },
    orderBy: [desc(posts.postDate)],
    limit: 20,
  })

  return (
    <PostForm
      postType="page"
      post={{
        id: page.id,
        postTitle: page.postTitle,
        postContent: page.postContent,
        postExcerpt: page.postExcerpt,
        postName: page.postName,
        postStatus: page.postStatus,
        postDate: page.postDate,
      }}
      revisions={revisions}
    />
  )
}
