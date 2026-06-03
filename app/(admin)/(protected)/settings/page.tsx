import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your site configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-title">Site Title</Label>
            <Input id="site-title" placeholder="My Pressload Site" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" placeholder="Just another Pressload site" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-url">Site URL</Label>
            <Input id="site-url" placeholder="https://example.com" disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Full settings management coming in Phase 5.
          </p>
          <Button disabled>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  )
}
