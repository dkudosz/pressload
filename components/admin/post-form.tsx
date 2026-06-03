'use client'

import { useRef, useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { JSONContent } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ImageIcon, RotateCcw, X, Plus } from 'lucide-react'
import { createPost, updatePost, restoreRevision } from '@/lib/actions/posts'
import { createTerm } from '@/lib/actions/taxonomies'
import { slugify } from '@/lib/utils/slugify'
import { cn } from '@/lib/utils'
import { Editor } from '@/components/editor/Editor'
import type { SaveStatus } from '@/components/editor/Editor'
import { MediaPicker } from '@/components/admin/MediaPicker'
import type { MediaItem } from '@/lib/actions/media'
import type { TermOption } from '@/lib/actions/taxonomies'

type PostStatus = 'draft' | 'publish' | 'pending' | 'private'

interface Revision {
  id: string
  postTitle: string
  postDate: Date | null
}

interface PostFormProps {
  postType: 'post' | 'page'
  post?: {
    id: string
    postTitle: string
    postContent: string | null
    postContentJson: unknown
    postExcerpt: string | null
    postName: string
    postStatus: string
    postDate: Date | null
  }
  revisions?: Revision[]
  featuredImageId?: string
  featuredImageUrl?: string
  categories?: TermOption[]
  initialCategoryIds?: string[]
  tags?: TermOption[]
  initialTagNames?: string[]
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline' }> = {
  publish: { label: 'Published', variant: 'success' },
  draft:   { label: 'Draft',     variant: 'secondary' },
  pending: { label: 'Pending',   variant: 'warning' },
  private: { label: 'Private',   variant: 'outline' },
  trash:   { label: 'Trash',     variant: 'destructive' as any },
}

export function PostForm({
  postType,
  post,
  revisions = [],
  featuredImageId: initialFeaturedImageId,
  featuredImageUrl: initialFeaturedImageUrl,
  categories = [],
  initialCategoryIds = [],
  tags = [],
  initialTagNames = [],
}: PostFormProps) {
  const isEditing = !!post
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(post?.postTitle ?? '')
  const [slug, setSlug] = useState(post?.postName ?? '')
  const [slugEdited, setSlugEdited] = useState(isEditing)
  const [contentHtml, setContentHtml] = useState(post?.postContent ?? '')
  const [contentJson, setContentJson] = useState<JSONContent | null>(
    (post?.postContentJson as JSONContent) ?? null,
  )
  const [excerpt, setExcerpt] = useState(post?.postExcerpt ?? '')
  const [status, setStatus] = useState<PostStatus>((post?.postStatus as PostStatus) ?? 'draft')
  const [publishDate, setPublishDate] = useState(
    post?.postDate ? new Date(post.postDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  )
  const [featuredImageId, setFeaturedImageId] = useState(initialFeaturedImageId ?? '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialFeaturedImageUrl ?? '')
  const [mediaPickerMode, setMediaPickerMode] = useState<'featured' | 'insert' | null>(null)
  const insertImageCallbackRef = useRef<((src: string, alt?: string) => void) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autosaveStatus, setAutosaveStatus] = useState<SaveStatus>('idle')

  // Taxonomy state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCategoryIds)
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialTagNames)
  const [tagInput, setTagInput] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [localCategories, setLocalCategories] = useState<TermOption[]>(categories)

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Always-fresh snapshot of form values for the autosave timeout closure.
  const latestRef = useRef({ title, slug, contentHtml, contentJson, excerpt, status, publishDate })
  useEffect(() => {
    latestRef.current = { title, slug, contentHtml, contentJson, excerpt, status, publishDate }
  })

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title))
  }, [title, slugEdited])

  function buildFormData(overrideStatus?: PostStatus): FormData {
    const fd = new FormData()
    fd.set('postTitle', title)
    fd.set('postContent', contentHtml)
    fd.set('postContentJson', contentJson ? JSON.stringify(contentJson) : '')
    fd.set('postExcerpt', excerpt)
    fd.set('postName', slug)
    fd.set('postStatus', overrideStatus ?? status)
    fd.set('postDate', publishDate)
    fd.set('postType', postType)
    fd.set('thumbnailId', featuredImageId)
    fd.set('categoryIds', selectedCategoryIds.join(','))
    fd.set('tagNames', selectedTagNames.join(','))
    return fd
  }

  function addTag(raw: string) {
    const names = raw.split(',').map((s) => s.trim()).filter(Boolean)
    setSelectedTagNames((prev) => {
      const next = [...prev]
      for (const n of names) {
        if (!next.includes(n)) next.push(n)
      }
      return next
    })
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    setAddingCat(true)
    try {
      const newTerm = await createTerm({ name: newCatName.trim(), taxonomy: 'category' })
      setLocalCategories((prev) => [...prev, newTerm])
      setSelectedCategoryIds((prev) => [...prev, newTerm.termTaxonomyId])
      setNewCatName('')
    } catch {
      // ignore
    } finally {
      setAddingCat(false)
    }
  }

  function handleEditorImageButtonClick(insertFn: (src: string, alt?: string) => void) {
    insertImageCallbackRef.current = insertFn
    setMediaPickerMode('insert')
  }

  function handleMediaPickerSelect(item: MediaItem) {
    if (mediaPickerMode === 'insert') {
      insertImageCallbackRef.current?.(item.url, item.alt)
    } else if (mediaPickerMode === 'featured') {
      setFeaturedImageId(item.id)
      setFeaturedImageUrl(item.url)
    }
    setMediaPickerMode(null)
  }

  function scheduleAutosave() {
    if (!isEditing || !post) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(async () => {
      const v = latestRef.current
      const fd = new FormData()
      fd.set('postTitle', v.title)
      fd.set('postContent', v.contentHtml)
      fd.set('postContentJson', v.contentJson ? JSON.stringify(v.contentJson) : '')
      fd.set('postExcerpt', v.excerpt)
      fd.set('postName', v.slug)
      fd.set('postStatus', v.status)
      fd.set('postDate', v.publishDate)
      fd.set('postType', postType)
      setAutosaveStatus('saving')
      try {
        await updatePost(post.id, fd)
        setAutosaveStatus('saved')
      } catch {
        setAutosaveStatus('idle')
      }
    }, 30_000)
  }

  function handleEditorChange(json: JSONContent, html: string) {
    setContentJson(json)
    setContentHtml(html)
    scheduleAutosave()
  }

  async function handleSave(overrideStatus?: PostStatus) {
    setError(null)
    const fd = buildFormData(overrideStatus)
    try {
      if (isEditing) {
        await updatePost(post!.id, fd)
      } else {
        await createPost(fd)
      }
    } catch (e: any) {
      if (e?.message !== 'NEXT_REDIRECT') setError(e?.message ?? 'Something went wrong')
    }
  }

  async function handlePublish() {
    if (isEditing && post) {
      setError(null)
      startTransition(async () => {
        try {
          const fd = buildFormData('publish')
          await updatePost(post.id, fd)
          setStatus('publish')
        } catch (e: any) {
          if (e?.message !== 'NEXT_REDIRECT') setError(e?.message ?? 'Something went wrong')
        }
      })
    } else {
      startTransition(() => handleSave('publish'))
    }
  }

  async function handleRestoreRevision(revisionId: string) {
    if (!post) return
    setError(null)
    startTransition(async () => {
      try {
        await restoreRevision(revisionId, post.id)
        router.refresh()
      } catch (e: any) {
        setError(e?.message ?? 'Failed to restore revision')
      }
    })
  }

  const listPath = `/${postType}s`
  const typeLabel = postType === 'page' ? 'Page' : 'Post'
  const currentStatus = STATUS_LABELS[status] ?? STATUS_LABELS.draft

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={listPath}>
            <ArrowLeft className="h-4 w-4" />
            {typeLabel}s
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? `Edit ${typeLabel}` : `New ${typeLabel}`}
        </h1>
        {isEditing && (
          <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="postTitle">Title</Label>
                <Input
                  id="postTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Enter ${typeLabel.toLowerCase()} title…`}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postName">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="postName"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value)
                      setSlugEdited(true)
                    }}
                    placeholder="url-slug"
                    className="font-mono text-sm"
                  />
                  {slugEdited && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSlugEdited(false)
                        setSlug(slugify(title))
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Editor
                  initialContent={contentJson}
                  initialHtml={post?.postContent ?? undefined}
                  onChange={handleEditorChange}
                  saveStatus={autosaveStatus}
                  onImageButtonClick={handleEditorImageButtonClick}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postStatus">Status</Label>
                <select
                  id="postStatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PostStatus)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Review</option>
                  <option value="private">Private</option>
                  <option value="publish">Published</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postDate">Publish Date</Label>
                <Input
                  id="postDate"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => startTransition(() => handleSave())}
                  variant="outline"
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? 'Saving…' : 'Save Draft'}
                </Button>
                {status !== 'publish' && (
                  <Button
                    onClick={handlePublish}
                    disabled={isPending}
                    className="w-full"
                  >
                    {isPending ? 'Publishing…' : 'Publish'}
                  </Button>
                )}
                {status === 'publish' && (
                  <Button
                    onClick={() => startTransition(() => handleSave('publish'))}
                    disabled={isPending}
                    className="w-full"
                  >
                    {isPending ? 'Updating…' : 'Update'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Optional summary…"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredImageUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredImageUrl}
                    alt="Featured image"
                    className="w-full rounded-md border border-border object-cover"
                    style={{ maxHeight: 160 }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => { setFeaturedImageId(''); setFeaturedImageUrl('') }}
                  >
                    <X className="h-3 w-3" />
                    Remove featured image
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setMediaPickerMode('featured')}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Set Featured Image
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Categories (posts only) */}
          {postType === 'post' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {localCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">No categories yet.</p>
                )}
                {buildCategoryTree(localCategories, null).map((cat) =>
                  renderCategoryNode(cat, localCategories, selectedCategoryIds, setSelectedCategoryIds, 0),
                )}
                <Separator className="my-2" />
                <p className="text-xs font-medium text-muted-foreground">Add new category</p>
                <div className="flex gap-1">
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
                    placeholder="Category name"
                    className="h-7 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    onClick={handleAddCategory}
                    disabled={addingCat || !newCatName.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags (posts only) */}
          {postType === 'post' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedTagNames.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTagNames.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setSelectedTagNames((prev) => prev.filter((t) => t !== tag))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput('') } }}
                  placeholder="Add tags, comma-separated"
                  className="h-7 text-xs"
                />
                <p className="text-xs text-muted-foreground">Separate with commas or Enter</p>
              </CardContent>
            </Card>
          )}

          {/* Revisions */}
          {isEditing && revisions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Revisions ({revisions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {revisions.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground truncate">
                      {rev.postDate
                        ? new Date(rev.postDate).toLocaleString()
                        : 'Unknown date'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs shrink-0"
                      onClick={() => handleRestoreRevision(rev.id)}
                      disabled={isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MediaPicker
        open={mediaPickerMode !== null}
        onClose={() => setMediaPickerMode(null)}
        onSelect={handleMediaPickerSelect}
        title={mediaPickerMode === 'featured' ? 'Set Featured Image' : 'Insert Image'}
      />
    </div>
  )
}

function buildCategoryTree(
  cats: TermOption[],
  parentId: string | null,
): TermOption[] {
  return cats.filter((c) => c.parentId === parentId)
}

function renderCategoryNode(
  cat: TermOption,
  allCats: TermOption[],
  selectedIds: string[],
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
  depth: number,
): React.ReactNode {
  const children = buildCategoryTree(allCats, cat.termTaxonomyId)
  const checked = selectedIds.includes(cat.termTaxonomyId)

  return (
    <div key={cat.termTaxonomyId} style={{ paddingLeft: depth * 16 }}>
      <label className="flex items-center gap-2 cursor-pointer py-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...prev, cat.termTaxonomyId])
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== cat.termTaxonomyId))
            }
          }}
          className="h-3.5 w-3.5 rounded"
        />
        <span className="text-sm">{cat.name}</span>
      </label>
      {children.map((child) =>
        renderCategoryNode(child, allCats, selectedIds, setSelectedIds, depth + 1),
      )}
    </div>
  )
}
