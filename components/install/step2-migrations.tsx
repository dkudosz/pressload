'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { runMigrations } from '@/app/install/actions'

const TABLE_LABELS: Record<string, string> = {
  pl_users: 'User accounts',
  pl_usermeta: 'User metadata',
  pl_posts: 'Posts and pages',
  pl_postmeta: 'Post metadata',
  pl_terms: 'Terms (categories, tags)',
  pl_term_taxonomy: 'Term taxonomies',
  pl_term_relationships: 'Post-term relationships',
  pl_termmeta: 'Term metadata',
  pl_comments: 'Comments',
  pl_commentmeta: 'Comment metadata',
  pl_options: 'Site options',
  pl_links: 'Links',
}

export function InstallStep2() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [createdTables, setCreatedTables] = useState<string[]>([])
  const [error, setError] = useState('')

  async function handleRunMigrations() {
    setStatus('running')
    setCreatedTables([])
    setError('')

    const result = await runMigrations()

    if (result.success) {
      setCreatedTables(result.tables)
      setStatus('done')
    } else {
      setCreatedTables(result.tables)
      setStatus('error')
      setError(result.error ?? 'Migration failed.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Database Tables</CardTitle>
        <CardDescription>
          Pressload will create 12 database tables to store your content, users, and settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border divide-y divide-border">
          {Object.entries(TABLE_LABELS).map(([table, label]) => {
            const created = createdTables.includes(table)
            const isPending = status === 'running' && !created
            return (
              <div key={table} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="text-sm font-mono text-muted-foreground">{table}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {label}</span>
                </div>
                <span className="text-sm">
                  {created ? (
                    <span className="text-emerald-400">✓</span>
                  ) : isPending ? (
                    <span className="text-muted-foreground animate-pulse">...</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>

        {status === 'error' && (
          <div className="rounded-md p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {status === 'idle' && (
          <Button onClick={handleRunMigrations} className="w-full">
            Run Migrations
          </Button>
        )}

        {status === 'running' && (
          <Button disabled className="w-full">
            Creating tables...
          </Button>
        )}

        {status === 'done' && (
          <Button onClick={() => router.push('/install/setup')} className="w-full">
            Continue to Site Setup
          </Button>
        )}

        {status === 'error' && (
          <Button variant="outline" onClick={handleRunMigrations} className="w-full">
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
