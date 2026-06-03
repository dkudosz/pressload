import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { posts, postmeta } from '@/lib/db/schema'
import { eq, desc, inArray, count } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/api/auth'
import { paginated, created, unauthorized, badRequest, serverError } from '@/lib/api/response'
import { parseQueryParams } from '@/lib/api/query'
import { uploadFile, buildUploadPath } from '@/lib/storage'

export async function GET(req: NextRequest) {
  try {
    const q = parseQueryParams(req.nextUrl.searchParams)
    const where = eq(posts.postType, 'attachment')
    const [{ total }] = await db.select({ total: count() }).from(posts).where(where)

    const rows = await db.query.posts.findMany({
      where,
      orderBy: [desc(posts.postDate)],
      limit: q.perPage,
      offset: (q.page - 1) * q.perPage,
    })

    const ids = rows.map((r) => r.id)
    const metaRows = ids.length > 0
      ? await db.query.postmeta.findMany({ where: inArray(postmeta.postId, ids) })
      : []
    const metaByPost = new Map<string, Record<string, string>>()
    for (const m of metaRows) {
      if (!m.postId || !m.metaKey) continue
      const map = metaByPost.get(m.postId) ?? {}
      map[m.metaKey] = m.metaValue ?? ''
      metaByPost.set(m.postId, map)
    }

    const data = rows.map((r) => {
      const meta = metaByPost.get(r.id) ?? {}
      let width = 0, height = 0, filesize = 0
      try {
        const md = JSON.parse(meta['_wp_attachment_metadata'] ?? '{}')
        width = md.width ?? 0; height = md.height ?? 0; filesize = md.filesize ?? 0
      } catch {}
      return {
        id: r.id,
        title: r.postTitle,
        url: r.guid ?? '',
        mime_type: r.postMimeType ?? '',
        date: r.postDate?.toISOString() ?? null,
        alt: meta['_wp_attachment_image_alt'] ?? '',
        caption: r.postExcerpt ?? '',
        width, height, filesize,
      }
    })

    return paginated(data, { total, page: q.page, per_page: q.perPage })
  } catch {
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiUser = await authenticateRequest(req)
    if (!apiUser) return unauthorized()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return badRequest('file is required')

    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = buildUploadPath(file.name)
    const { url } = await uploadFile(buffer, filePath, file.type)

    const slug = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 200)
    const [attachment] = await db
      .insert(posts)
      .values({
        postAuthor: apiUser.id,
        postTitle: file.name,
        postContent: '',
        postName: slug,
        postStatus: 'inherit',
        postType: 'attachment',
        postMimeType: file.type,
        guid: url,
      })
      .returning()

    await db.insert(postmeta).values({ postId: attachment.id, metaKey: '_wp_attached_file', metaValue: filePath })

    return created({
      id: attachment.id,
      title: attachment.postTitle,
      url,
      mime_type: file.type,
      filesize: file.size,
    })
  } catch {
    return serverError()
  }
}
