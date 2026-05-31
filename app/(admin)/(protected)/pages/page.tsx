import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, File, Pencil, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, ilike, count, ne, desc } from 'drizzle-orm'
import { deletePost } from '@/lib/actions/posts'

const PAGE_SIZE = 10

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline' | 'destructive' }> = {
  publish: { label: 'Published', variant: 'success' },
  draft:   { label: 'Draft',     variant: 'secondary' },
  pending: { label: 'Pending',   variant: 'warning' },
  private: { label: 'Private',   variant: 'outline' },
  trash:   { label: 'Trash',     variant: 'destructive' },
}

interface Props {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function PagesPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status ?? 'all'
  const searchQuery = params.search ?? ''
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10))

  const baseWhere = and(
    eq(posts.postType, 'page'),
    ne(posts.postStatus, 'inherit'),
  )

  const [allCount, draftCount, publishCount, trashCount] = await Promise.all([
    db.select({ n: count() }).from(posts).where(baseWhere),
    db.select({ n: count() }).from(posts).where(and(baseWhere, eq(posts.postStatus, 'draft'))),
    db.select({ n: count() }).from(posts).where(and(baseWhere, eq(posts.postStatus, 'publish'))),
    db.select({ n: count() }).from(posts).where(and(baseWhere, eq(posts.postStatus, 'trash'))),
  ])

  const filterWhere = and(
    baseWhere,
    statusFilter !== 'all' ? eq(posts.postStatus, statusFilter) : undefined,
    searchQuery ? ilike(posts.postTitle, `%${searchQuery}%`) : undefined,
  )

  const [totalResult, rows] = await Promise.all([
    db.select({ n: count() }).from(posts).where(filterWhere),
    db
      .select({
        id: posts.id,
        postTitle: posts.postTitle,
        postStatus: posts.postStatus,
        postDate: posts.postDate,
        postName: posts.postName,
        authorName: users.displayName,
      })
      .from(posts)
      .leftJoin(users, eq(posts.postAuthor, users.id))
      .where(filterWhere)
      .orderBy(desc(posts.postDate))
      .limit(PAGE_SIZE)
      .offset((currentPage - 1) * PAGE_SIZE),
  ])

  const total = totalResult[0]?.n ?? 0
  const totalPages = Math.ceil(Number(total) / PAGE_SIZE)

  const tabs = [
    { key: 'all',     label: 'All',       count: allCount[0]?.n ?? 0 },
    { key: 'draft',   label: 'Draft',     count: draftCount[0]?.n ?? 0 },
    { key: 'publish', label: 'Published', count: publishCount[0]?.n ?? 0 },
    { key: 'trash',   label: 'Trash',     count: trashCount[0]?.n ?? 0 },
  ]

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (statusFilter !== 'all' && overrides.status === undefined) p.set('status', statusFilter)
    if (searchQuery && overrides.search === undefined) p.set('search', searchQuery)
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== undefined && v !== '') p.set(k, v)
      else p.delete(k)
    }
    const qs = p.toString()
    return `/pages${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pages</h1>
          <p className="text-muted-foreground mt-1">Manage static pages.</p>
        </div>
        <Button asChild>
          <Link href="/pages/new">
            <Plus className="h-4 w-4" />
            New Page
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={buildUrl({ status: tab.key === 'all' ? undefined : tab.key, page: undefined })}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              statusFilter === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {tab.count.toString()}
            </span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/pages" className="flex gap-2 max-w-sm">
        {statusFilter !== 'all' && (
          <input type="hidden" name="status" value={statusFilter} />
        )}
        <input
          type="search"
          name="search"
          defaultValue={searchQuery}
          placeholder="Search pages…"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="outline" size="sm">Search</Button>
        {searchQuery && (
          <Button asChild variant="ghost" size="sm">
            <Link href={buildUrl({ search: undefined, page: undefined })}>Clear</Link>
          </Button>
        )}
      </form>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No pages found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {searchQuery ? `No pages match "${searchQuery}".` : 'Create your first static page.'}
            </p>
            <Button asChild>
              <Link href="/pages/new">
                <Plus className="h-4 w-4" />
                Create Page
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Author</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((page) => {
                  const badge = STATUS_BADGE[page.postStatus] ?? STATUS_BADGE.draft
                  const isTrash = page.postStatus === 'trash'
                  return (
                    <tr key={page.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {page.postTitle || <span className="text-muted-foreground italic">(no title)</span>}
                        </div>
                        {page.postName && (
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            /{page.postName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {page.authorName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {page.postDate
                          ? new Date(page.postDate).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {!isTrash && (
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/pages/${page.id}`}>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                            </Button>
                          )}
                          <form
                            action={async () => {
                              'use server'
                              await deletePost(page.id)
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className={isTrash ? 'text-destructive hover:text-destructive' : 'text-muted-foreground hover:text-destructive'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {isTrash ? 'Delete' : 'Trash'}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({total.toString()} pages)
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildUrl({ page: String(currentPage - 1) })}>Previous</Link>
                  </Button>
                )}
                {currentPage < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildUrl({ page: String(currentPage + 1) })}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
