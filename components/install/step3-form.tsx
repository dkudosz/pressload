'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { setupSite } from '@/app/install/actions'

export function InstallStep3Form({ defaultSiteUrl }: { defaultSiteUrl: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const form = e.currentTarget
    const data = {
      siteTitle: (form.elements.namedItem('siteTitle') as HTMLInputElement).value,
      siteUrl: (form.elements.namedItem('siteUrl') as HTMLInputElement).value,
      adminEmail: (form.elements.namedItem('adminEmail') as HTMLInputElement).value,
      adminUsername: (form.elements.namedItem('adminUsername') as HTMLInputElement).value,
      adminPassword: (form.elements.namedItem('adminPassword') as HTMLInputElement).value,
      adminPasswordConfirm: (form.elements.namedItem('adminPasswordConfirm') as HTMLInputElement).value,
      timezone: (form.elements.namedItem('timezone') as HTMLInputElement).value,
    }

    const errors: Record<string, string> = {}
    if (!data.siteTitle) errors.siteTitle = 'Site title is required'
    if (!data.adminEmail) errors.adminEmail = 'Admin email is required'
    if (!data.adminUsername) errors.adminUsername = 'Admin username is required'
    if (!data.adminPassword) errors.adminPassword = 'Password is required'
    if (data.adminPassword.length < 8) errors.adminPassword = 'Password must be at least 8 characters'
    if (data.adminPassword !== data.adminPasswordConfirm) {
      errors.adminPasswordConfirm = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    startTransition(async () => {
      const result = await setupSite({
        siteTitle: data.siteTitle,
        siteUrl: data.siteUrl,
        adminEmail: data.adminEmail,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword,
        timezone: data.timezone || 'UTC',
      })

      if (result.success) {
        router.push('/install/success')
      } else {
        setError(result.error ?? 'Installation failed. Please try again.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Information</CardTitle>
        <CardDescription>
          Configure your site and create your administrator account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteTitle">Site Title</Label>
            <Input id="siteTitle" name="siteTitle" placeholder="My Pressload Site" disabled={isPending} />
            {fieldErrors.siteTitle && <p className="text-xs text-destructive">{fieldErrors.siteTitle}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input id="siteUrl" name="siteUrl" defaultValue={defaultSiteUrl} placeholder="https://example.com" disabled={isPending} />
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground mb-3">Administrator Account</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input id="adminEmail" name="adminEmail" type="email" placeholder="admin@example.com" disabled={isPending} />
                {fieldErrors.adminEmail && <p className="text-xs text-destructive">{fieldErrors.adminEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminUsername">Username</Label>
                <Input id="adminUsername" name="adminUsername" placeholder="admin" disabled={isPending} />
                {fieldErrors.adminUsername && <p className="text-xs text-destructive">{fieldErrors.adminUsername}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input id="adminPassword" name="adminPassword" type="password" placeholder="Min. 8 characters" disabled={isPending} />
                {fieldErrors.adminPassword && <p className="text-xs text-destructive">{fieldErrors.adminPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPasswordConfirm">Confirm Password</Label>
                <Input id="adminPasswordConfirm" name="adminPasswordConfirm" type="password" placeholder="Repeat password" disabled={isPending} />
                {fieldErrors.adminPasswordConfirm && <p className="text-xs text-destructive">{fieldErrors.adminPasswordConfirm}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" name="timezone" placeholder="UTC" defaultValue="UTC" disabled={isPending} />
          </div>

          {error && (
            <div className="rounded-md p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Installing Pressload...' : 'Install Pressload'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
