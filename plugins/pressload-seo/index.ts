import type { HookSystem } from '@/lib/hooks'

export interface PostContext {
  id: string
  postTitle: string
  postName: string
  postExcerpt?: string | null
  postDate?: Date | null
  authorName?: string | null
  siteUrl?: string
  seoTitle?: string
  seoDescription?: string
  seoOgImageUrl?: string
}

export interface JsonLdSchema {
  '@context': string
  '@type': string
  [key: string]: unknown
}

export function register(hooks: HookSystem): void {
  // Add Article JSON-LD structured data to blog posts
  hooks.addFilter(
    'pressload.post.json_ld',
    (rawSchemas: unknown, rawCtx: unknown) => {
      const schemas = rawSchemas as JsonLdSchema[]
      const ctx = rawCtx as PostContext

      const url = ctx.siteUrl
        ? `${ctx.siteUrl}/blog/${ctx.postName}`
        : `/blog/${ctx.postName}`

      const article: JsonLdSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: ctx.seoTitle || ctx.postTitle,
        description: ctx.seoDescription || ctx.postExcerpt || undefined,
        url,
        datePublished: ctx.postDate?.toISOString(),
        author: ctx.authorName
          ? { '@type': 'Person', name: ctx.authorName }
          : undefined,
        image: ctx.seoOgImageUrl || undefined,
      }

      const breadcrumb: JsonLdSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.siteUrl || '/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${ctx.siteUrl || ''}/blog` },
          { '@type': 'ListItem', position: 3, name: ctx.postTitle, item: url },
        ],
      }

      return [...schemas, article, breadcrumb]
    },
    10,
  )

  // Filter post content — identity by default; other plugins can chain onto this
  hooks.addFilter('pressload.content.render', (html: unknown) => html, 10)
}
