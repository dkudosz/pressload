import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPermalinkSettings, savePermalinkSettings } from '@/lib/actions/settings'

const PRESETS = [
  { label: 'Plain', value: '/?p=%post_id%' },
  { label: 'Day and name', value: '/%year%/%monthnum%/%day%/%postname%/' },
  { label: 'Month and name', value: '/%year%/%monthnum%/%postname%/' },
  { label: 'Numeric', value: '/archives/%post_id%' },
  { label: 'Post name', value: '/%postname%/' },
]

export default async function PermalinksPage() {
  const opts = await getPermalinkSettings()
  const current = opts.permalink_structure ?? '/%postname%/'

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Permalink Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose the URL structure for your content.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={savePermalinkSettings} className="space-y-4">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground mb-3">Common settings</legend>
              {PRESETS.map((preset) => (
                <label key={preset.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="permalink_structure"
                    value={preset.value}
                    defaultChecked={current === preset.value}
                    className="h-4 w-4"
                  />
                  <div>
                    <span className="text-sm font-medium">{preset.label}</span>
                    <code className="ml-2 text-xs text-muted-foreground">{preset.value}</code>
                  </div>
                </label>
              ))}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="permalink_structure"
                  value="custom"
                  defaultChecked={!PRESETS.some((p) => p.value === current)}
                  className="h-4 w-4 mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium">Custom structure</span>
                  <Input
                    name="custom_permalink_structure"
                    defaultValue={!PRESETS.some((p) => p.value === current) ? current : ''}
                    placeholder="/%postname%/"
                    className="h-8 text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available tags: <code>%year%</code>, <code>%monthnum%</code>, <code>%day%</code>, <code>%postname%</code>, <code>%post_id%</code>
                  </p>
                </div>
              </label>
            </fieldset>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
