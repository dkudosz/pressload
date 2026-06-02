import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { posts, terms, termTaxonomy } from '@/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { getOption } from '@/lib/options'

export const dynamic = 'force-dynamic'

function xmlEscape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry(loc: string, lastmod?: string, priority = '0.7') {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function GET() {
  const siteUrl = await getOption('siteurl', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  const base = siteUrl.replace(/\/$/, '')

  // Published posts and pages
  const publishedContent = await db.query.posts.findMany({
    where: and(
      eq(posts.postStatus, 'publish'),
      or(eq(posts.postType, 'post'), eq(posts.postType, 'page')),
    ),
    columns: { postName: true, postType: true, postModified: true },
    orderBy: (p, { desc }) => [desc(p.postDate)],
  })

  // Taxonomy terms
  const taxTerms = await db
    .select({ slug: terms.slug, taxonomy: termTaxonomy.taxonomy })
    .from(termTaxonomy)
    .innerJoin(terms, eq(termTaxonomy.termId, terms.termId))
    .where(or(eq(termTaxonomy.taxonomy, 'category'), eq(termTaxonomy.taxonomy, 'post_tag')))

  const entries: string[] = [
    urlEntry(`${base}/`, undefined, '1.0'),
    urlEntry(`${base}/blog`, undefined, '0.8'),
  ]

  for (const item of publishedContent) {
    const url =
      item.postType === 'post'
        ? `${base}/blog/${item.postName}`
        : `${base}/${item.postName}`
    const lastmod = item.postModified
      ? new Date(item.postModified).toISOString().split('T')[0]
      : undefined
    entries.push(urlEntry(url, lastmod))
  }

  for (const term of taxTerms) {
    const prefix = term.taxonomy === 'category' ? 'category' : 'tag'
    entries.push(urlEntry(`${base}/blog/${prefix}/${term.slug}`, undefined, '0.5'))
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n')

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
