'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react'
import { removeMenuItem, moveMenuItemUp, moveMenuItemDown, updateMenuItem } from '@/lib/actions/menus'
import type { MenuItem } from '@/lib/actions/menus'
import { useRouter } from 'next/navigation'

interface Props {
  items: MenuItem[]
  menuId: string
}

export function MenuItemList({ items, menuId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editUrl, setEditUrl] = useState('')

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditLabel(item.label)
    setEditUrl(item.url)
  }

  function saveEdit() {
    if (!editingId) return
    const id = editingId
    const fd = new FormData()
    fd.set('label', editLabel)
    fd.set('url', editUrl)
    setEditingId(null)
    run(() => updateMenuItem(id, fd))
  }

  return (
    <div className="space-y-1">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
        >
          {editingId === item.id ? (
            <>
              <div className="flex-1 flex gap-2">
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="Label"
                />
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="h-7 text-xs flex-1 font-mono"
                  placeholder="URL"
                />
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5 text-primary" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <span className="ml-2 text-xs text-muted-foreground font-mono truncate">{item.url}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  disabled={idx === 0 || isPending}
                  onClick={() => run(() => moveMenuItemUp(item.id))}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  disabled={idx === items.length - 1 || isPending}
                  onClick={() => run(() => moveMenuItemDown(item.id))}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => startEdit(item)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm('Remove this menu item?')) run(() => removeMenuItem(item.id))
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
