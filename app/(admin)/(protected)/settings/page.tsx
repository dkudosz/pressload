import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getGeneralSettings, saveGeneralSettings } from '@/lib/actions/settings'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Berlin', 'Europe/Warsaw',
  'Asia/Tokyo', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney',
]

export default async function GeneralSettingsPage() {
  const opts = await getGeneralSettings()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Basic site identity and locale.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={saveGeneralSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blogname">Site Title</Label>
              <Input
                id="blogname"
                name="blogname"
                defaultValue={opts.blogname ?? ''}
                placeholder="My Pressload Site"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blogdescription">Tagline</Label>
              <Input
                id="blogdescription"
                name="blogdescription"
                defaultValue={opts.blogdescription ?? ''}
                placeholder="Just another Pressload site"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteurl">Site URL</Label>
              <Input
                id="siteurl"
                name="siteurl"
                type="url"
                defaultValue={opts.siteurl ?? ''}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email</Label>
              <Input
                id="admin_email"
                name="admin_email"
                type="email"
                defaultValue={opts.admin_email ?? ''}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone_string">Timezone</Label>
              <select
                id="timezone_string"
                name="timezone_string"
                defaultValue={opts.timezone_string ?? 'UTC'}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Input
                  id="date_format"
                  name="date_format"
                  defaultValue={opts.date_format ?? 'F j, Y'}
                  placeholder="F j, Y"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_format">Time Format</Label>
                <Input
                  id="time_format"
                  name="time_format"
                  defaultValue={opts.time_format ?? 'g:i a'}
                  placeholder="g:i a"
                />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
