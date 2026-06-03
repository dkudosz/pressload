'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { activatePlugin, deactivatePlugin } from '@/lib/actions/plugins'
import { useRouter } from 'next/navigation'

interface Props {
  name: string
  isActive: boolean
}

export function PluginToggle({ name, isActive }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    setError(null)
    startTransition(async () => {
      try {
        if (isActive) {
          await deactivatePlugin(name)
        } else {
          await activatePlugin(name)
        }
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <Button
        variant={isActive ? 'outline' : 'default'}
        size="sm"
        onClick={toggle}
        disabled={isPending}
        className="shrink-0"
      >
        {isPending ? '…' : isActive ? 'Deactivate' : 'Activate'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
