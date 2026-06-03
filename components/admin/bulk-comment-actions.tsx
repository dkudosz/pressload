'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { bulkUpdateComments } from '@/lib/actions/comments'
import { useRouter } from 'next/navigation'

interface Props {
  commentIds: string[]
}

export function BulkCommentActions({ commentIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [action, setAction] = useState<'approve' | 'spam' | 'trash' | 'delete'>('approve')

  const allSelected = selectedIds.length === commentIds.length && commentIds.length > 0

  function toggleAll() {
    setSelectedIds(allSelected ? [] : [...commentIds])
  }

  function applyBulk() {
    if (!selectedIds.length) return
    startTransition(async () => {
      await bulkUpdateComments(selectedIds, action)
      setSelectedIds([])
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
      <input
        type="checkbox"
        checked={allSelected}
        onChange={toggleAll}
        className="h-3.5 w-3.5 rounded"
        aria-label="Select all"
      />
      <select
        value={action}
        onChange={(e) => setAction(e.target.value as typeof action)}
        className="h-7 rounded border border-input bg-transparent px-2 py-0 text-xs focus-visible:outline-none"
      >
        <option value="approve">Approve</option>
        <option value="spam">Mark as Spam</option>
        <option value="trash">Move to Trash</option>
        <option value="delete">Delete Permanently</option>
      </select>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={applyBulk}
        disabled={!selectedIds.length || isPending}
      >
        Apply
      </Button>
      {selectedIds.length > 0 && (
        <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
      )}
    </div>
  )
}
