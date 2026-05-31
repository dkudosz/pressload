'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { posts, postmeta } from '@/lib/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { uploadFile, deleteFile, buildUploadPath } from '@/lib/storage'
import { getPostMeta, updatePostMeta } from '@/lib/postmeta'

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return session
}

export interface MediaItem {
  id: string
  title: string
  url: string
  mimeType: string
  postDate: Date | null
  alt: string
  caption: string
  width: number
  height: number
  filesize: number
  path: string
}

interface SizeEntry {
  file: string
  width: number
  height: number
  mimeType: string
  url: string
}

const IMAGE_SIZES = [
  { name: 'thumbnail', width: 150, height: 150, fit: 'cover' as const },
  { name: 'medium',    width: 300, height: 300, fit: 'inside' as const },
  { name: 'large',     width: 1024, height: 1024, fit: 'inside' as const },
]

export async function uploadMedia(formData: FormData): Promise<MediaItem> {
  const session = await requireAuth()

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('No file provided')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const originalPath = buildUploadPath(file.name)
  const { url: originalUrl } = await uploadFile(buffer, originalPath, file.type)

  const isImage = file.type.startsWith('image/')
  let width = 0
  let height = 0
  const sizes: Record<string, SizeEntry> = {}

  if (isImage) {
    const sharp = (await import('sharp')).default
    const meta = await sharp(buffer).metadata()
    width = meta.width ?? 0
    height = meta.height ?? 0

    for (const size of IMAGE_SIZES) {
      if (width === 0 || height === 0) break
      if (width <= size.width && height <= size.height) continue

      const resizedBuffer = await sharp(buffer)
        .resize(size.width, size.height, { fit: size.fit, withoutEnlargement: true })
        .toBuffer({ resolveWithObject: true })

      const ext = file.name.split('.').pop() ?? 'jpg'
      const base = file.name.replace(/\.[^.]+$/, '')
      const sizeName = `${base}-${size.width}x${size.height}.${ext}`
      const sizePath = buildUploadPath(sizeName)

      await uploadFile(resizedBuffer.data, sizePath, file.type)

      sizes[size.name] = {
        file: sizePath,
        width: resizedBuffer.info.width,
        height: resizedBuffer.info.height,
        mimeType: file.type,
        url: sizePath,
      }
    }
  }

  const slug = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200)

  const [attachment] = await db
    .insert(posts)
    .values({
      postAuthor: session.user.id,
      postTitle: file.name,
      postContent: '',
      postExcerpt: '',
      postName: slug,
      postStatus: 'inherit',
      postType: 'attachment',
      postMimeType: file.type,
      guid: originalUrl,
      postDate: new Date(),
      postDateGmt: new Date(),
      postModified: new Date(),
      postModifiedGmt: new Date(),
    })
    .returning()

  await updatePostMeta(attachment.id, '_wp_attached_file', originalPath)
  await updatePostMeta(
    attachment.id,
    '_wp_attachment_metadata',
    JSON.stringify({ file: originalPath, width, height, filesize: file.size, sizes }),
  )

  revalidatePath('/media')

  return {
    id: attachment.id,
    title: attachment.postTitle,
    url: originalUrl,
    mimeType: file.type,
    postDate: attachment.postDate,
    alt: '',
    caption: '',
    width,
    height,
    filesize: file.size,
    path: originalPath,
  }
}

export async function deleteMedia(id: string): Promise<void> {
  await requireAuth()

  const filePath = (await getPostMeta(id, '_wp_attached_file', true)) as string
  const metadataStr = (await getPostMeta(id, '_wp_attachment_metadata', true)) as string

  if (filePath) {
    await deleteFile(filePath).catch(() => {})
  }

  if (metadataStr) {
    try {
      const metadata = JSON.parse(metadataStr) as { sizes?: Record<string, SizeEntry> }
      for (const entry of Object.values(metadata.sizes ?? {})) {
        if (entry.file) await deleteFile(entry.file).catch(() => {})
      }
    } catch {}
  }

  await db.delete(posts).where(eq(posts.id, id))

  revalidatePath('/media')
}

export async function updateMediaMeta(
  id: string,
  data: { title: string; alt: string; caption: string },
): Promise<void> {
  await requireAuth()

  await db
    .update(posts)
    .set({ postTitle: data.title, postExcerpt: data.caption })
    .where(eq(posts.id, id))

  await updatePostMeta(id, '_wp_attachment_image_alt', data.alt)

  revalidatePath('/media')
}

export async function getMediaItems(): Promise<MediaItem[]> {
  const attachments = await db.query.posts.findMany({
    where: eq(posts.postType, 'attachment'),
    orderBy: [desc(posts.postDate)],
  })

  if (!attachments.length) return []

  const ids = attachments.map((a) => a.id)
  const allMeta = await db.query.postmeta.findMany({
    where: inArray(postmeta.postId, ids),
  })

  const metaByPost = new Map<string, Record<string, string>>()
  for (const row of allMeta) {
    if (!row.postId || !row.metaKey) continue
    const map = metaByPost.get(row.postId) ?? {}
    map[row.metaKey] = row.metaValue ?? ''
    metaByPost.set(row.postId, map)
  }

  return attachments.map((a) => {
    const meta = metaByPost.get(a.id) ?? {}
    let width = 0
    let height = 0
    let filesize = 0
    let path = ''

    try {
      const metadata = JSON.parse(meta['_wp_attachment_metadata'] ?? '{}') as {
        width?: number
        height?: number
        filesize?: number
        file?: string
      }
      width = metadata.width ?? 0
      height = metadata.height ?? 0
      filesize = metadata.filesize ?? 0
      path = metadata.file ?? ''
    } catch {}

    return {
      id: a.id,
      title: a.postTitle,
      url: a.guid ?? '',
      mimeType: a.postMimeType ?? '',
      postDate: a.postDate,
      alt: meta['_wp_attachment_image_alt'] ?? '',
      caption: a.postExcerpt ?? '',
      width,
      height,
      filesize,
      path,
    }
  })
}
