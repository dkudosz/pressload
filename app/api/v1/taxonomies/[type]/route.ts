import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { terms, termTaxonomy } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, badRequest, serverError } from '@/lib/api/response'

const ALLOWED = ['category', 'post_tag']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params
    if (!ALLOWED.includes(type)) return badRequest(`taxonomy must be one of: ${ALLOWED.join(', ')}`)

    const rows = await db
      .select({
        id: termTaxonomy.termTaxonomyId,
        name: terms.name,
        slug: terms.slug,
        description: termTaxonomy.description,
        parentId: termTaxonomy.parent,
        count: termTaxonomy.count,
      })
      .from(termTaxonomy)
      .innerJoin(terms, eq(termTaxonomy.termId, terms.termId))
      .where(eq(termTaxonomy.taxonomy, type))

    return ok(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description ?? '',
        parent: r.parentId ?? null,
        count: r.count ?? 0,
        link: type === 'category' ? `/blog/category/${r.slug}` : `/blog/tag/${r.slug}`,
      })),
    )
  } catch {
    return serverError()
  }
}
