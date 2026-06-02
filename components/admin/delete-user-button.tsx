'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteUser } from '@/lib/actions/users'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  userName: string
}

export function DeleteUserButton({ userId, userName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleDelete() {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteUser(userId)
        router.refresh()
      } catch (e: any) {
        setError(e?.message ?? 'Failed to delete user')
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </>
  )
}
