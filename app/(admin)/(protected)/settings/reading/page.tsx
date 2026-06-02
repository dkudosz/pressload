import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getReadingSettings, saveReadingSettings } from '@/lib/actions/settings'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export default async function ReadingSettingsPage() {
  const opts = await getReadingSettings()
  const pages = await db.query.posts.findMany({
    where: and(eq(posts.postType, 'page'), eq(posts.postStatus, 'publish')),
    columns: { id: true, postTitle: true },
    orderBy: (p, { asc }) => [asc(p.postTitle)],
  })

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Reading Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Control what&apos;s displayed on your homepage and feed.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={saveReadingSettings} className="space-y-5">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Your homepage displays</legend>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="show_on_front"
                  value="posts"
                  defaultChecked={(opts.show_on_front ?? 'posts') === 'posts'}
                />
                <span className="text-sm">Your latest posts</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="show_on_front"
                  value="page"
                  defaultChecked={opts.show_on_front === 'page'}
                  id="show-page"
                />
                <Label htmlFor="show-page" className="cursor-pointer text-sm font-normal">A static page</Label>
              </div>
              {pages.length > 0 && (
                <div className="ml-6 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="page_on_front" className="text-xs">Homepage:</Label>
                    <select
                      id="page_on_front"
                      name="page_on_front"
                      defaultValue={opts.page_on_front ?? ''}
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">— Select —</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>{p.postTitle}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="page_for_posts" className="text-xs">Posts page:</Label>
                    <select
                      id="page_for_posts"
                      name="page_for_posts"
                      defaultValue={opts.page_for_posts ?? ''}
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">— Select —</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>{p.postTitle}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="posts_per_page">Blog pages show at most</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="posts_per_page"
                  name="posts_per_page"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={opts.posts_per_page ?? '10'}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">posts</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posts_per_rss">Feed shows at most</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="posts_per_rss"
                  name="posts_per_rss"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={opts.posts_per_rss ?? '10'}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">items</span>
              </div>
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
