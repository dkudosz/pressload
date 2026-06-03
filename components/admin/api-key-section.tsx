'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateApiKey, revokeApiKey } from '@/lib/actions/users'
import { useRouter } from 'next/navigation'
import { Copy, Eye, EyeOff } from 'lucide-react'

interface Props {
  keyActive: boolean
}

export function ApiKeySection({ keyActive: initialActive }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [key, setKey] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [keyActive, setKeyActive] = useState(initialActive)
  const [copied, setCopied] = useState(false)

  function generate() {
    startTransition(async () => {
      const newKey = await generateApiKey()
      setKey(newKey)
      setKeyActive(true)
      setVisible(true)
      router.refresh()
    })
  }

  function revoke() {
    if (!confirm('Revoke API key? Any integrations using it will stop working.')) return
    startTransition(async () => {
      await revokeApiKey()
      setKey(null)
      setKeyActive(false)
      router.refresh()
    })
  }

  function copyKey() {
    if (!key) return
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">API Key</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use an API key to authenticate requests to the Pressload REST API from external clients.
        </p>

        {key && (
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-xs font-medium text-foreground">Your new API key — copy it now, it won&apos;t be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-background border border-border rounded px-2 py-1.5 truncate">
                {visible ? key : '•'.repeat(64)}
              </code>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setVisible((v) => !v)}>
                {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copyKey}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {copied && <span className="text-xs text-primary">Copied!</span>}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant={keyActive ? 'outline' : 'default'}
            size="sm"
            onClick={generate}
            disabled={isPending}
          >
            {keyActive ? 'Regenerate API Key' : 'Generate API Key'}
          </Button>
          {keyActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={revoke}
              disabled={isPending}
            >
              Revoke
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Send <code className="bg-muted px-1 py-0.5 rounded">Authorization: Bearer &lt;key&gt;</code> in API requests.
        </p>
      </CardContent>
    </Card>
  )
}
