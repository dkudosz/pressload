import { type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { terms, termTaxonomy } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, serverError } from '@/lib/api/response'

export async function GET(_req: NextRequest) {
  try {
    const rows = await db
      .select({
        id: termTaxonomy.termTaxonomyId,
        termId: terms.termId,
        name: terms.name,
        slug: terms.slug,
        taxonomy: termTaxonomy.taxonomy,
        description: termTaxonomy.description,
        count: termTaxonomy.count,
      })
      .from(termTaxonomy)
      .innerJoin(terms, eq(termTaxonomy.termId, terms.termId))

    return ok(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        taxonomy: r.taxonomy,
        description: r.description ?? '',
        count: r.count ?? 0,
        link: r.taxonomy === 'category'
          ? `/blog/category/${r.slug}`
          : `/blog/tag/${r.slug}`,
      })),
    )
  } catch {
    return serverError()
  }
}
