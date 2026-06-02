'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitComment } from '@/lib/actions/comments'

interface Props {
  postId: string
}

export function CommentForm({ postId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('postId', postId)
    setError(null)

    startTransition(async () => {
      const result = await submitComment(fd)
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error ?? 'Something went wrong')
      }
    })
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Your comment is awaiting moderation. Thank you!
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">Leave a Comment</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="authorName">Name *</Label>
            <Input id="authorName" name="authorName" required placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorEmail">Email *</Label>
            <Input
              id="authorEmail"
              name="authorEmail"
              type="email"
              required
              placeholder="your@email.com"
            />
            <p className="text-xs text-muted-foreground">Not published.</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Comment *</Label>
          <textarea
            id="content"
            name="content"
            required
            placeholder="Write your comment…"
            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting…' : 'Post Comment'}
        </Button>
      </form>
    </div>
  )
}
