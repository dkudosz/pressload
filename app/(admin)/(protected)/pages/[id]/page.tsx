import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { PostForm } from '@/components/admin/post-form'
import { getPostMeta } from '@/lib/postmeta'

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

  const thumbnailId = (await getPostMeta(id, '_thumbnail_id', true)) as string
  let featuredImageUrl = ''
  if (thumbnailId) {
    const thumb = await db.query.posts.findFirst({
      where: and(eq(posts.id, thumbnailId), eq(posts.postType, 'attachment')),
      columns: { guid: true },
    })
    featuredImageUrl = thumb?.guid ?? ''
  }

  return (
    <PostForm
      postType="page"
      post={{
        id: page.id,
        postTitle: page.postTitle,
        postContent: page.postContent,
        postContentJson: page.postContentJson,
        postExcerpt: page.postExcerpt,
        postName: page.postName,
        postStatus: page.postStatus,
        postDate: page.postDate,
      }}
      revisions={revisions}
      featuredImageId={thumbnailId || undefined}
      featuredImageUrl={featuredImageUrl || undefined}
    />
  )
}
