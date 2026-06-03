'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { slugify } from '@/lib/utils/slugify'
import { updatePostMeta } from '@/lib/postmeta'

async function uniqueSlug(
  base: string,
  postType: string,
  excludeId?: string,
): Promise<string> {
  const slug = slugify(base) || 'untitled'

  const isSlugTaken = async (candidate: string) => {
    const existing = await db.query.posts.findFirst({
      where: excludeId
        ? and(
            eq(posts.postName, candidate),
            eq(posts.postType, postType),
            ne(posts.id, excludeId),
          )
        : and(eq(posts.postName, candidate), eq(posts.postType, postType)),
      columns: { id: true },
    })
    return !!existing
  }

  if (!(await isSlugTaken(slug))) return slug

  let suffix = 2
  while (await isSlugTaken(`${slug}-${suffix}`)) {
    suffix++
  }
  return `${slug}-${suffix}`
}

type PostType = 'post' | 'page'

interface PostInput {
  postTitle: string
  postContent: string
  postExcerpt: string
  postName: string
  postStatus: 'draft' | 'publish' | 'pending' | 'private'
  postDate: string
  postType: PostType
}

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return session
}

async function saveRevision(postId: string, authorId: string) {
  const original = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  })
  if (!original) return

  await db.insert(posts).values({
    postAuthor: authorId,
    postTitle: original.postTitle,
    postContent: original.postContent,
    postExcerpt: original.postExcerpt,
    postName: `${original.postName}-revision-v${Date.now()}`,
    postStatus: 'inherit',
    postType: 'revision',
    postParent: postId,
    postDate: original.postModified ?? new Date(),
    postDateGmt: original.postModified ?? new Date(),
  })
}

export async function createPost(formData: FormData) {
  const session = await requireAuth()

  const title = (formData.get('postTitle') as string) ?? ''
  const postType = ((formData.get('postType') as string) ?? 'post') as PostType
  const rawSlug = (formData.get('postName') as string) ?? ''
  const slug = await uniqueSlug(rawSlug || title, postType)
  const status = ((formData.get('postStatus') as string) ?? 'draft') as PostInput['postStatus']
  const rawDate = formData.get('postDate') as string
  const postDate = rawDate ? new Date(rawDate) : new Date()

  const [post] = await db
    .insert(posts)
    .values({
      postAuthor: session.user.id,
      postTitle: title,
      postContent: (formData.get('postContent') as string) ?? '',
      postExcerpt: (formData.get('postExcerpt') as string) ?? '',
      postName: slug,
      postStatus: status,
      postType,
      postDate,
      postDateGmt: postDate,
      postModified: new Date(),
      postModifiedGmt: new Date(),
    })
    .returning()

  await updatePostMeta(post.id, '_edit_last', session.user.id)

  revalidatePath(`/${postType}s`)

  const base = postType === 'page' ? '/pages' : '/posts'
  redirect(`${base}/${post.id}`)
}

export async function updatePost(id: string, formData: FormData) {
  const session = await requireAuth()

  const existing = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    columns: { id: true, postName: true, postType: true },
  })
  if (!existing) throw new Error('Post not found')

  await saveRevision(id, session.user.id)

  const title = (formData.get('postTitle') as string) ?? ''
  const rawSlug = (formData.get('postName') as string) ?? ''
  const slug = rawSlug !== existing.postName
    ? await uniqueSlug(rawSlug, existing.postType as PostType, id)
    : existing.postName

  const status = ((formData.get('postStatus') as string) ?? 'draft') as PostInput['postStatus']
  const rawDate = formData.get('postDate') as string
  const postDate = rawDate ? new Date(rawDate) : new Date()

  await db
    .update(posts)
    .set({
      postTitle: title,
      postContent: (formData.get('postContent') as string) ?? '',
      postExcerpt: (formData.get('postExcerpt') as string) ?? '',
      postName: slug,
      postStatus: status,
      postDate,
      postDateGmt: postDate,
      postModified: new Date(),
      postModifiedGmt: new Date(),
    })
    .where(eq(posts.id, id))

  await updatePostMeta(id, '_edit_last', session.user.id)

  revalidatePath(`/${existing.postType}s`)
  revalidatePath(`/${existing.postType}s/${id}`)
  if (existing.postType === 'post') revalidatePath('/blog')
}

export async function deletePost(id: string) {
  await requireAuth()

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    columns: { id: true, postStatus: true, postType: true },
  })
  if (!post) throw new Error('Post not found')

  if (post.postStatus === 'trash') {
    // permanent delete
    await db.delete(posts).where(eq(posts.id, id))
  } else {
    // move to trash
    await db
      .update(posts)
      .set({ postStatus: 'trash', postModified: new Date(), postModifiedGmt: new Date() })
      .where(eq(posts.id, id))
  }

  revalidatePath(`/${post.postType}s`)
}

export async function publishPost(id: string) {
  await requireAuth()

  await db
    .update(posts)
    .set({
      postStatus: 'publish',
      postDate: new Date(),
      postDateGmt: new Date(),
      postModified: new Date(),
      postModifiedGmt: new Date(),
    })
    .where(eq(posts.id, id))

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    columns: { postType: true, postName: true },
  })

  revalidatePath(`/${post?.postType}s`)
  if (post?.postType === 'post') revalidatePath(`/blog/${post.postName}`)
  if (post?.postType === 'page') revalidatePath(`/${post.postName}`)
}

export async function restoreRevision(revisionId: string, postId: string) {
  const session = await requireAuth()

  const revision = await db.query.posts.findFirst({
    where: and(eq(posts.id, revisionId), eq(posts.postType, 'revision')),
  })
  if (!revision) throw new Error('Revision not found')

  await saveRevision(postId, session.user.id)

  await db
    .update(posts)
    .set({
      postTitle: revision.postTitle,
      postContent: revision.postContent,
      postExcerpt: revision.postExcerpt,
      postModified: new Date(),
      postModifiedGmt: new Date(),
    })
    .where(eq(posts.id, postId))

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { postType: true },
  })

  revalidatePath(`/${post?.postType}s/${postId}`)
}
