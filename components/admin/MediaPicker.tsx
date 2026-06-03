'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Film, ImageIcon, Loader2, Search, Upload, X, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MediaItem } from '@/lib/actions/media'
import { getMediaItems, uploadMedia } from '@/lib/actions/media'

interface UploadState {
  id: string
  filename: string
  status: 'queued' | 'uploading' | 'done' | 'error'
  error?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (item: MediaItem) => void
  title?: string
}

function MediaIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className={className} />
  if (mimeType.startsWith('video/')) return <Film className={className} />
  return <FileText className={className} />
}

export function MediaPicker({ open, onClose, onSelect, title = 'Select Media' }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState<UploadState[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getMediaItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [open])

  const filteredItems = items.filter(
    (item) =>
      item.mimeType.startsWith('image/') &&
      (!search || item.title.toLowerCase().includes(search.toLowerCase())),
  )

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
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length) processFiles(files)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) processFiles(files)
    e.target.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload strip */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'flex items-center gap-3 rounded-md border border-dashed p-3 text-sm transition-colors',
              isDragOver ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Drag images here or</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              browse
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Upload progress */}
          {uploading.length > 0 && (
            <div className="space-y-1">
              {uploading.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-xs"
                >
                  {u.status === 'uploading' && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                  {u.status === 'done' && <Check className="h-3 w-3 text-green-500" />}
                  {u.status === 'error' && <X className="h-3 w-3 text-destructive" />}
                  {u.status === 'queued' && (
                    <div className="h-3 w-3 rounded-full border border-border" />
                  )}
                  <span className="truncate text-foreground">{u.filename}</span>
                  {u.status === 'error' && (
                    <span className="ml-auto shrink-0 text-destructive">{u.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search images…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">
                {items.length === 0 ? 'No images uploaded yet.' : 'No images match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item); onClose() }}
                  className="group relative aspect-square overflow-hidden rounded border border-border bg-muted transition-all hover:scale-[1.02] hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.alt || item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MediaIcon mimeType={item.mimeType} className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="line-clamp-2 text-left text-[10px] text-white">{item.title}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
