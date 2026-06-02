import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDiscussionSettings, saveDiscussionSettings } from '@/lib/actions/settings'

function CheckboxRow({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 rounded" />
      <span className="text-sm">{label}</span>
    </label>
  )
}

export default async function DiscussionSettingsPage() {
  const opts = await getDiscussionSettings()
  const is = (key: string) => opts[key] === '1'

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Discussion Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Control how comments and pingbacks work.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={saveDiscussionSettings} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground mb-2">Default post settings</legend>
              <div className="space-y-2">
                <Label htmlFor="default_comment_status">Allow comments on new posts</Label>
                <select
                  id="default_comment_status"
                  name="default_comment_status"
                  defaultValue={opts.default_comment_status ?? 'open'}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="open">Open (allow comments)</option>
                  <option value="closed">Closed (disallow comments)</option>
                </select>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground mb-2">Email notifications</legend>
              <CheckboxRow
                name="comments_notify"
                label="Email me when anyone posts a comment"
                checked={is('comments_notify')}
              />
              <CheckboxRow
                name="moderation_notify"
                label="Email me when a comment is held for moderation"
                checked={is('moderation_notify')}
              />
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground mb-2">Comment moderation</legend>
              <CheckboxRow
                name="comment_moderation"
                label="Hold all comments for manual approval"
                checked={is('comment_moderation')}
              />
              <CheckboxRow
                name="comment_registration"
                label="Users must be registered to comment"
                checked={is('comment_registration')}
              />
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground mb-2">Comment age</legend>
              <CheckboxRow
                name="close_comments_for_old_posts"
                label="Automatically close comments on old posts"
                checked={is('close_comments_for_old_posts')}
              />
              <div className="flex items-center gap-2 ml-6">
                <span className="text-sm text-muted-foreground">Close after</span>
                <Input
                  name="close_comments_days_old"
                  type="number"
                  min={1}
                  defaultValue={opts.close_comments_days_old ?? '14'}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground mb-2">Threaded comments</legend>
              <CheckboxRow
                name="thread_comments"
                label="Enable threaded (nested) comments"
                checked={is('thread_comments')}
              />
              <div className="flex items-center gap-2 ml-6">
                <Input
                  name="thread_comments_depth"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={opts.thread_comments_depth ?? '5'}
                  className="w-16 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground">levels deep</span>
              </div>
            </fieldset>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
