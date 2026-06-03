import { db } from '@/lib/db'
import { postmeta } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function getPostMeta(
  postId: string,
  key: string,
  single = true,
): Promise<string | string[]> {
  const rows = await db.query.postmeta.findMany({
    where: and(eq(postmeta.postId, postId), eq(postmeta.metaKey, key)),
    columns: { metaValue: true },
  })
  if (single) return rows[0]?.metaValue ?? ''
  return rows.map((r) => r.metaValue ?? '')
}

export async function updatePostMeta(
  postId: string,
  key: string,
  value: string,
): Promise<void> {
  const existing = await db.query.postmeta.findFirst({
    where: and(eq(postmeta.postId, postId), eq(postmeta.metaKey, key)),
    columns: { metaId: true },
  })

  if (existing) {
    await db
      .update(postmeta)
      .set({ metaValue: value })
      .where(and(eq(postmeta.postId, postId), eq(postmeta.metaKey, key)))
  } else {
    await db.insert(postmeta).values({ postId, metaKey: key, metaValue: value })
  }
}

export async function addPostMeta(
  postId: string,
  key: string,
  value: string,
): Promise<void> {
  await db.insert(postmeta).values({ postId, metaKey: key, metaValue: value })
}

export async function deletePostMeta(postId: string, key: string): Promise<void> {
  await db
    .delete(postmeta)
    .where(and(eq(postmeta.postId, postId), eq(postmeta.metaKey, key)))
}
