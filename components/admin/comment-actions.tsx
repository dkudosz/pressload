'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  approveComment,
  unapproveComment,
  spamComment,
  trashComment,
  deleteComment,
  replyToComment,
} from '@/lib/actions/comments'
import type { CommentListItem } from '@/lib/actions/comments'
import { useRouter } from 'next/navigation'

interface Props {
  comment: CommentListItem
}

export function CommentActions({ comment }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  const isApproved = comment.commentApproved === '1'

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {isApproved ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={isPending}
            onClick={() => run(() => unapproveComment(comment.commentId))}
          >
            Unapprove
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary hover:text-primary"
            disabled={isPending}
            onClick={() => run(() => approveComment(comment.commentId))}
          >
            Approve
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={() => setShowReply((v) => !v)}
        >
          Reply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={() => run(() => spamComment(comment.commentId))}
        >
          Spam
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={() => run(() => trashComment(comment.commentId))}
        >
          Trash
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => {
            if (confirm('Permanently delete this comment?')) run(() => deleteComment(comment.commentId))
          }}
        >
          Delete
        </Button>
      </div>
      {showReply && (
        <div className="flex gap-2 w-full max-w-sm mt-1">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Your reply…"
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            className="h-8 text-xs shrink-0"
            disabled={!replyText.trim() || isPending}
            onClick={() => {
              run(async () => {
                await replyToComment(comment.commentId, replyText)
                setReplyText('')
                setShowReply(false)
              })
            }}
          >
            Send
          </Button>
        </div>
      )}
    </div>
  )
}
