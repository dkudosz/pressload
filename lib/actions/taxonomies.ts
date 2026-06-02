'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { terms, termTaxonomy, termRelationships } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { slugify } from '@/lib/utils/slugify'

export interface TermOption {
  termTaxonomyId: string
  termId: string
  name: string
  slug: string
  parentId: string | null
  description: string
  count: number
}

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return session
}

async function uniqueTermSlug(base: string, excludeTermId?: string): Promise<string> {
  const slug = slugify(base) || 'term'
  const existing = await db.query.terms.findFirst({
    where: eq(terms.slug, slug),
    columns: { termId: true },
  })
  if (!existing || existing.termId === excludeTermId) return slug
  let suffix = 2
  while (true) {
    const candidate = `${slug}-${suffix}`
    const taken = await db.query.terms.findFirst({
      where: eq(terms.slug, candidate),
      columns: { termId: true },
    })
    if (!taken || taken.termId === excludeTermId) return candidate
    suffix++
  }
}

export async function getTerms(taxonomy: 'category' | 'post_tag'): Promise<TermOption[]> {
  const rows = await db
    .select({
      termTaxonomyId: termTaxonomy.termTaxonomyId,
      termId: terms.termId,
      name: terms.name,
      slug: terms.slug,
      parentId: termTaxonomy.parent,
      description: termTaxonomy.description,
      count: termTaxonomy.count,
    })
    .from(termTaxonomy)
    .innerJoin(terms, eq(termTaxonomy.termId, terms.termId))
    .where(eq(termTaxonomy.taxonomy, taxonomy))

  return rows.map((r) => ({
    termTaxonomyId: r.termTaxonomyId,
    termId: r.termId,
    name: r.name,
    slug: r.slug,
    parentId: r.parentId ?? null,
    description: r.description ?? '',
    count: r.count ?? 0,
  }))
}

export async function createTerm(data: {
  name: string
  slug?: string
  taxonomy: 'category' | 'post_tag'
  parentId?: string | null
  description?: string
}): Promise<TermOption> {
  await requireAuth()

  const slug = await uniqueTermSlug(data.slug || data.name)

  const [term] = await db
    .insert(terms)
    .values({ name: data.name, slug })
    .returning()

  const [tt] = await db
    .insert(termTaxonomy)
    .values({
      termId: term.termId,
      taxonomy: data.taxonomy,
      description: data.description ?? '',
      parent: data.parentId ?? null,
      count: 0,
    })
    .returning()

  revalidatePath('/posts')
  revalidatePath('/pages')

  return {
    termTaxonomyId: tt.termTaxonomyId,
    termId: term.termId,
    name: term.name,
    slug: term.slug,
    parentId: tt.parent ?? null,
    description: tt.description ?? '',
    count: 0,
  }
}

export async function updateTerm(
  termTaxonomyId: string,
  data: {
    name: string
    slug: string
    description?: string
    parentId?: string | null
  },
): Promise<void> {
  await requireAuth()

  const tt = await db.query.termTaxonomy.findFirst({
    where: eq(termTaxonomy.termTaxonomyId, termTaxonomyId),
    columns: { termId: true },
  })
  if (!tt) throw new Error('Term not found')

  const slug = await uniqueTermSlug(data.slug || data.name, tt.termId)

  await db
    .update(terms)
    .set({ name: data.name, slug })
    .where(eq(terms.termId, tt.termId))

  await db
    .update(termTaxonomy)
    .set({
      description: data.description ?? '',
      parent: data.parentId ?? null,
    })
    .where(eq(termTaxonomy.termTaxonomyId, termTaxonomyId))

  revalidatePath('/posts')
  revalidatePath('/pages')
}

export async function deleteTerm(termTaxonomyId: string): Promise<void> {
  await requireAuth()

  const tt = await db.query.termTaxonomy.findFirst({
    where: eq(termTaxonomy.termTaxonomyId, termTaxonomyId),
    columns: { termId: true },
  })
  if (!tt) return

  // Cascade via FK: deleting termTaxonomy removes termRelationships
  await db.delete(termTaxonomy).where(eq(termTaxonomy.termTaxonomyId, termTaxonomyId))
  // Remove orphan term if no other taxonomy references it
  const remaining = await db.query.termTaxonomy.findFirst({
    where: eq(termTaxonomy.termId, tt.termId),
    columns: { termTaxonomyId: true },
  })
  if (!remaining) {
    await db.delete(terms).where(eq(terms.termId, tt.termId))
  }

  revalidatePath('/posts')
  revalidatePath('/pages')
}

export async function assignTermsToPost(
  postId: string,
  termTaxonomyIds: string[],
  taxonomy: 'category' | 'post_tag',
): Promise<void> {
  // Remove existing relationships for this taxonomy
  const existingTtIds = await db
    .select({ termTaxonomyId: termTaxonomy.termTaxonomyId })
    .from(termTaxonomy)
    .where(eq(termTaxonomy.taxonomy, taxonomy))

  const allTtIdsForTaxonomy = existingTtIds.map((r) => r.termTaxonomyId)

  if (allTtIdsForTaxonomy.length > 0) {
    await db
      .delete(termRelationships)
      .where(
        and(
          eq(termRelationships.objectId, postId),
          inArray(termRelationships.termTaxonomyId, allTtIdsForTaxonomy),
        ),
      )
  }

  if (termTaxonomyIds.length > 0) {
    await db.insert(termRelationships).values(
      termTaxonomyIds.map((ttId) => ({
        objectId: postId,
        termTaxonomyId: ttId,
        termOrder: 0,
      })),
    )
  }

  // Update counts
  for (const ttId of allTtIdsForTaxonomy) {
    const countResult = await db
      .select()
      .from(termRelationships)
      .where(eq(termRelationships.termTaxonomyId, ttId))
    await db
      .update(termTaxonomy)
      .set({ count: countResult.length })
      .where(eq(termTaxonomy.termTaxonomyId, ttId))
  }
}

export async function getPostTerms(
  postId: string,
  taxonomy: 'category' | 'post_tag',
): Promise<TermOption[]> {
  const rows = await db
    .select({
      termTaxonomyId: termTaxonomy.termTaxonomyId,
      termId: terms.termId,
      name: terms.name,
      slug: terms.slug,
      parentId: termTaxonomy.parent,
      description: termTaxonomy.description,
      count: termTaxonomy.count,
    })
    .from(termRelationships)
    .innerJoin(
      termTaxonomy,
      eq(termRelationships.termTaxonomyId, termTaxonomy.termTaxonomyId),
    )
    .innerJoin(terms, eq(termTaxonomy.termId, terms.termId))
    .where(
      and(
        eq(termRelationships.objectId, postId),
        eq(termTaxonomy.taxonomy, taxonomy),
      ),
    )

  return rows.map((r) => ({
    termTaxonomyId: r.termTaxonomyId,
    termId: r.termId,
    name: r.name,
    slug: r.slug,
    parentId: r.parentId ?? null,
    description: r.description ?? '',
    count: r.count ?? 0,
  }))
}
