'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { comments, posts, users } from '@/lib/db/schema'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'

export type CommentStatus = 'pending' | 'approved' | 'spam' | 'trash'

export interface CommentListItem {
  commentId: string
  commentAuthor: string
  commentAuthorEmail: string
  commentContent: string
  commentDate: Date | null
  commentApproved: string
  commentParent: string | null
  postId: string | null
  postTitle: string
  userId: string | null
}

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getComments(filter?: string): Promise<CommentListItem[]> {
  const allComments = await db
    .select({
      commentId: comments.commentId,
      commentAuthor: comments.commentAuthor,
      commentAuthorEmail: comments.commentAuthorEmail,
      commentContent: comments.commentContent,
      commentDate: comments.commentDate,
      commentApproved: comments.commentApproved,
      commentParent: comments.commentParent,
      postId: comments.commentPostId,
      postTitle: posts.postTitle,
      userId: comments.userId,
    })
    .from(comments)
    .leftJoin(posts, eq(comments.commentPostId, posts.id))
    .orderBy(desc(comments.commentDate))

  return allComments
    .filter((c) => {
      if (!filter || filter === 'all') return true
      if (filter === 'pending') return c.commentApproved === '0'
      if (filter === 'approved') return c.commentApproved === '1'
      if (filter === 'spam') return c.commentApproved === 'spam'
      if (filter === 'trash') return c.commentApproved === 'trash'
      return true
    })
    .map((c) => ({
      ...c,
      postTitle: c.postTitle ?? '(no post)',
    }))
}

export async function approveComment(id: string): Promise<void> {
  await requireAuth()
  await db
    .update(comments)
    .set({ commentApproved: '1' })
    .where(eq(comments.commentId, id))
  revalidatePath('/comments')
}

export async function unapproveComment(id: string): Promise<void> {
  await requireAuth()
  await db
    .update(comments)
    .set({ commentApproved: '0' })
    .where(eq(comments.commentId, id))
  revalidatePath('/comments')
}

export async function spamComment(id: string): Promise<void> {
  await requireAuth()
  await db
    .update(comments)
    .set({ commentApproved: 'spam' })
    .where(eq(comments.commentId, id))
  revalidatePath('/comments')
}

export async function trashComment(id: string): Promise<void> {
  await requireAuth()
  await db
    .update(comments)
    .set({ commentApproved: 'trash' })
    .where(eq(comments.commentId, id))
  revalidatePath('/comments')
}

export async function deleteComment(id: string): Promise<void> {
  await requireAuth()
  await db.delete(comments).where(eq(comments.commentId, id))
  revalidatePath('/comments')
}

export async function replyToComment(
  parentId: string,
  content: string,
): Promise<void> {
  const session = await requireAuth()

  const parent = await db.query.comments.findFirst({
    where: eq(comments.commentId, parentId),
    columns: { commentPostId: true },
  })
  if (!parent) throw new Error('Comment not found')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { displayName: true, userEmail: true },
  })

  await db.insert(comments).values({
    commentPostId: parent.commentPostId,
    commentAuthor: user?.displayName ?? 'Admin',
    commentAuthorEmail: user?.userEmail ?? '',
    commentContent: content,
    commentApproved: '1',
    commentParent: parentId,
    userId: session.user.id,
    commentType: 'comment',
  })

  if (parent.commentPostId) {
    await db
      .update(posts)
      .set({ commentCount: db.$count(comments, eq(comments.commentPostId, parent.commentPostId)) as unknown as number })
      .where(eq(posts.id, parent.commentPostId))
  }

  revalidatePath('/comments')
}

export async function bulkUpdateComments(
  ids: string[],
  action: 'approve' | 'spam' | 'trash' | 'delete',
): Promise<void> {
  await requireAuth()
  if (ids.length === 0) return

  if (action === 'delete') {
    await db.delete(comments).where(inArray(comments.commentId, ids))
  } else {
    const statusMap = { approve: '1', spam: 'spam', trash: 'trash' } as const
    await db
      .update(comments)
      .set({ commentApproved: statusMap[action] })
      .where(inArray(comments.commentId, ids))
  }
  revalidatePath('/comments')
}

export async function submitComment(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const postId = (formData.get('postId') as string) ?? ''
  const authorName = (formData.get('authorName') as string) ?? ''
  const authorEmail = (formData.get('authorEmail') as string) ?? ''
  const content = (formData.get('content') as string) ?? ''
  const parentId = (formData.get('parentId') as string) ?? null

  if (!postId || !authorName || !authorEmail || !content) {
    return { success: false, error: 'Name, email, and comment are required' }
  }

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.commentStatus, 'open')),
    columns: { id: true, postTitle: true, postAuthor: true },
  })
  if (!post) return { success: false, error: 'Comments are closed for this post' }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const userAgent = headersList.get('user-agent') ?? ''

  const session = await auth()

  const [comment] = await db
    .insert(comments)
    .values({
      commentPostId: postId,
      commentAuthor: authorName,
      commentAuthorEmail: authorEmail,
      commentContent: content,
      commentApproved: '0',
      commentParent: parentId || null,
      commentAuthorIp: ip,
      commentAgent: userAgent,
      commentType: 'comment',
      userId: session?.user?.id ?? null,
    })
    .returning()

  // Send email notification to post author (skip gracefully if not configured)
  if (process.env.RESEND_API_KEY && post.postAuthor) {
    try {
      const postAuthor = await db.query.users.findFirst({
        where: eq(users.id, post.postAuthor),
        columns: { userEmail: true, displayName: true },
      })
      if (postAuthor?.userEmail) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Pressload <noreply@pressload.local>',
          to: postAuthor.userEmail,
          subject: `New comment on "${post.postTitle}"`,
          text: [
            `${authorName} (${authorEmail}) left a comment on "${post.postTitle}":`,
            '',
            content,
            '',
            'Moderate this comment in your admin dashboard.',
          ].join('\n'),
        })
      }
    } catch {
      // Email failure is non-fatal
    }
  }

  revalidatePath('/blog/[slug]', 'page')

  return { success: true }
}
