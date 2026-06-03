'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { testDatabaseConnection, checkTablesExist } from '@/app/install/actions'

export function InstallStep1Form({ initialUrl }: { initialUrl: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dbUrl, setDbUrl] = useState(initialUrl)
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleTest() {
    if (!dbUrl.trim()) {
      setStatus('error')
      setMessage('Please enter a database URL.')
      return
    }

    setStatus('testing')
    setMessage('')

    const result = await testDatabaseConnection(dbUrl)
    if (!result.success) {
      setStatus('error')
      setMessage(result.error ?? 'Connection failed. Check your DATABASE_URL.')
      return
    }

    // Check if already installed
    const { exists } = await checkTablesExist(dbUrl)
    if (exists) {
      setStatus('error')
      setMessage('Pressload is already installed. Please sign in to your dashboard.')
      return
    }

    setStatus('success')
    setMessage('Connection successful!')
  }

  function handleContinue() {
    startTransition(() => {
      router.push('/install/database')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Connection</CardTitle>
        <CardDescription>
          Enter your PostgreSQL connection string. Pressload will use this database to store all content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="db-url">Database URL</Label>
          <Input
            id="db-url"
            type="text"
            placeholder="postgresql://user:password@host:5432/dbname"
            value={dbUrl}
            onChange={(e) => {
              setDbUrl(e.target.value)
              setStatus('idle')
            }}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Format: <code className="bg-muted px-1 py-0.5 rounded text-xs">postgresql://user:password@host:5432/dbname</code>
          </p>
        </div>

        {status !== 'idle' && (
          <div
            className={`rounded-md p-3 text-sm ${
              status === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : status === 'error'
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {status === 'testing' ? 'Testing connection...' : message}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isPending || status === 'testing'}
            className="flex-1"
          >
            {status === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={status !== 'success' || isPending}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
