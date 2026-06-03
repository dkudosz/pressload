'use client'

import { useRef, useState, useTransition } from 'react'
import {
  Copy,
  FileText,
  Film,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { MediaItem } from '@/lib/actions/media'
import { uploadMedia, deleteMedia, updateMediaMeta } from '@/lib/actions/media'

interface UploadState {
  id: string
  filename: string
  status: 'queued' | 'uploading' | 'done' | 'error'
  error?: string
}

type Filter = 'all' | 'image' | 'video' | 'document'

interface Props {
  initialItems: MediaItem[]
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function mimeToFilter(mime: string): Filter {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'document'
}

function MediaIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className={className} />
  if (mimeType.startsWith('video/')) return <Film className={className} />
  return <FileText className={className} />
}

function MediaCard({
  item,
  onClick,
}: {
  item: MediaItem
  onClick: () => void
}) {
  const isImage = item.mimeType.startsWith('image/')
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted transition-colors hover:border-primary/50 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt={item.alt || item.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
          <MediaIcon mimeType={item.mimeType} className="h-8 w-8 text-muted-foreground" />
          <span className="line-clamp-2 text-center text-xs text-muted-foreground">
            {item.title}
          </span>
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-white">{item.title}</p>
      </div>
    </button>
  )
}

export function MediaLibraryClient({ initialItems }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialItems)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState<UploadState[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Detail panel edit state
  const [editTitle, setEditTitle] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [, startTransition] = useTransition()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredItems = items.filter((item) => {
    if (filter !== 'all' && mimeToFilter(item.mimeType) !== filter) return false
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function processFiles(files: File[]) {
    const batch: UploadState[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      filename: f.name,
      status: 'queued',
    }))
    setUploading((prev) => [...prev, ...batch])

    for (let i = 0; i < files.length; i++) {
      const uploadId = batch[i].id
      setUploading((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'uploading' } : u)),
      )
      try {
        const fd = new FormData()
        fd.set('file', files[i])
        const newItem = await uploadMedia(fd)
        setItems((prev) => [newItem, ...prev])
        setUploading((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, status: 'done' } : u)),
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setUploading((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, status: 'error', error: msg } : u)),
        )
      }
    }

    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => u.status !== 'done'))
    }, 2500)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) processFiles(files)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) processFiles(files)
    e.target.value = ''
  }

  function openDetail(item: MediaItem) {
    setSelectedItem(item)
    setEditTitle(item.title)
    setEditAlt(item.alt)
    setEditCaption(item.caption)
    setSaveStatus('idle')
    setConfirmDelete(false)
    setCopiedUrl(false)
    setDetailOpen(true)
  }

  async function handleSaveMeta() {
    if (!selectedItem) return
    setSaveStatus('saving')
    try {
      await updateMediaMeta(selectedItem.id, {
        title: editTitle,
        alt: editAlt,
        caption: editCaption,
      })
      const updated = { ...selectedItem, title: editTitle, alt: editAlt, caption: editCaption }
      setItems((prev) => prev.map((i) => (i.id === selectedItem.id ? updated : i)))
      setSelectedItem(updated)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('idle')
    }
  }

  function handleDelete() {
    if (!selectedItem) return
    startTransition(async () => {
      try {
        await deleteMedia(selectedItem.id)
        setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
        setDetailOpen(false)
      } catch {}
    })
  }

  async function handleCopyUrl() {
    if (!selectedItem) return
    await navigator.clipboard.writeText(selectedItem.url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="mt-1 text-muted-foreground">Manage uploaded files and images.</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30 hover:border-primary/40',
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Drag and drop files here</p>
        <p className="mt-1 text-xs text-muted-foreground">or</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Browse files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Active uploads */}
      {uploading.length > 0 && (
        <div className="space-y-1.5">
          {uploading.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {u.status === 'uploading' && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              )}
              {u.status === 'done' && <Check className="h-4 w-4 shrink-0 text-green-500" />}
              {u.status === 'error' && <X className="h-4 w-4 shrink-0 text-destructive" />}
              {u.status === 'queued' && (
                <div className="h-4 w-4 shrink-0 rounded-full border border-border" />
              )}
              <span className="min-w-0 flex-1 truncate text-foreground">{u.filename}</span>
              {u.status === 'error' && (
                <span className="shrink-0 text-xs text-destructive">{u.error}</span>
              )}
              {(u.status === 'done' || u.status === 'error') && (
                <button
                  type="button"
                  onClick={() => setUploading((prev) => prev.filter((x) => x.id !== u.id))}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filter bar + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md border border-border bg-card p-1">
          {(['all', 'image', 'video', 'document'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded px-3 py-1 text-sm capitalize transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="font-medium text-foreground">
            {items.length === 0 ? 'No media yet' : 'No results'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length === 0
              ? 'Upload images, videos, and documents above.'
              : 'Try adjusting the filter or search term.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredItems.map((item) => (
            <MediaCard key={item.id} item={item} onClick={() => openDetail(item)} />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-6 truncate">{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Preview */}
              <div className="flex items-center justify-center rounded-md border border-border bg-muted p-4">
                {selectedItem.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.alt || selectedItem.title}
                    className="max-h-56 max-w-full rounded object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <MediaIcon
                      mimeType={selectedItem.mimeType}
                      className="h-16 w-16 text-muted-foreground"
                    />
                    <Badge variant="secondary" className="text-xs">
                      {selectedItem.mimeType}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Info + edit */}
              <div className="space-y-4 overflow-y-auto">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="media-title">Title</Label>
                    <Input
                      id="media-title"
                      value={editTitle}
                      onChange={(e) => { setEditTitle(e.target.value); setSaveStatus('idle') }}
                    />
                  </div>
                  {selectedItem.mimeType.startsWith('image/') && (
                    <div className="space-y-1">
                      <Label htmlFor="media-alt">Alt Text</Label>
                      <Input
                        id="media-alt"
                        value={editAlt}
                        onChange={(e) => { setEditAlt(e.target.value); setSaveStatus('idle') }}
                        placeholder="Describe the image…"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="media-caption">Caption</Label>
                    <Input
                      id="media-caption"
                      value={editCaption}
                      onChange={(e) => { setEditCaption(e.target.value); setSaveStatus('idle') }}
                      placeholder="Optional caption…"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveMeta}
                    disabled={saveStatus === 'saving'}
                    className="w-full"
                  >
                    {saveStatus === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {saveStatus === 'saved' && <Check className="h-3.5 w-3.5 text-green-500" />}
                    {saveStatus === 'idle' && 'Save'}
                    {saveStatus === 'saving' && 'Saving…'}
                    {saveStatus === 'saved' && 'Saved'}
                  </Button>
                </div>

                {/* File info */}
                <div className="space-y-1.5 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="min-w-[4rem] font-medium text-foreground">URL</span>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="flex min-w-0 flex-1 items-center gap-1 truncate rounded hover:text-foreground"
                      title={selectedItem.url}
                    >
                      <span className="truncate">{selectedItem.url}</span>
                      {copiedUrl ? (
                        <Check className="h-3 w-3 shrink-0 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                  </div>
                  {selectedItem.width > 0 && (
                    <div className="flex gap-2">
                      <span className="min-w-[4rem] font-medium text-foreground">Size</span>
                      <span>{selectedItem.width} × {selectedItem.height} px</span>
                    </div>
                  )}
                  {selectedItem.filesize > 0 && (
                    <div className="flex gap-2">
                      <span className="min-w-[4rem] font-medium text-foreground">File size</span>
                      <span>{formatBytes(selectedItem.filesize)}</span>
                    </div>
                  )}
                  {selectedItem.postDate && (
                    <div className="flex gap-2">
                      <span className="min-w-[4rem] font-medium text-foreground">Uploaded</span>
                      <span>{new Date(selectedItem.postDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="min-w-[4rem] font-medium text-foreground">Type</span>
                    <span>{selectedItem.mimeType}</span>
                  </div>
                </div>

                {/* Delete */}
                {confirmDelete ? (
                  <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm text-destructive">
                      Delete this file permanently? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={handleDelete} className="flex-1">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete File
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
