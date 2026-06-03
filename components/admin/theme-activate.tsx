'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { activateTheme } from '@/lib/actions/themes'
import { useRouter } from 'next/navigation'

interface Props {
  name: string
}

export function ThemeActivate({ name }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function activate() {
    startTransition(async () => {
      await activateTheme(name)
      router.refresh()
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={activate} disabled={isPending} className="w-full">
      {isPending ? 'Activating…' : 'Activate'}
    </Button>
  )
}
