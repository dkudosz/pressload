import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { PostForm } from '@/components/admin/post-form'
import { getPostMeta } from '@/lib/postmeta'
import { getTerms, getPostTerms } from '@/lib/actions/taxonomies'

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

  const [thumbnailId, allCategories, allTags, postCategories, postTags,
    seoTitle, seoDescription, seoCanonical, seoNoindexRaw, seoOgImageUrl] = await Promise.all([
    getPostMeta(id, '_thumbnail_id', true) as Promise<string>,
    getTerms('category'),
    getTerms('post_tag'),
    getPostTerms(id, 'category'),
    getPostTerms(id, 'post_tag'),
    getPostMeta(id, '_seo_title', true) as Promise<string>,
    getPostMeta(id, '_seo_description', true) as Promise<string>,
    getPostMeta(id, '_seo_canonical', true) as Promise<string>,
    getPostMeta(id, '_seo_noindex', true) as Promise<string>,
    getPostMeta(id, '_seo_og_image_url', true) as Promise<string>,
  ])

  let featuredImageUrl = ''
  if (thumbnailId) {
    const thumb = await db.query.posts.findFirst({
      where: and(eq(posts.id, thumbnailId as string), eq(posts.postType, 'attachment')),
      columns: { guid: true },
    })
    featuredImageUrl = thumb?.guid ?? ''
  }

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
      featuredImageId={thumbnailId as string || undefined}
      featuredImageUrl={featuredImageUrl || undefined}
      categories={allCategories}
      initialCategoryIds={postCategories.map((c) => c.termTaxonomyId)}
      tags={allTags}
      initialTagNames={postTags.map((t) => t.name)}
      seoMeta={{
        seoTitle: seoTitle as string,
        seoDescription: seoDescription as string,
        seoCanonical: seoCanonical as string,
        seoNoindex: (seoNoindexRaw as string) === '1',
        seoOgImageUrl: seoOgImageUrl as string,
      }}
    />
  )
}
