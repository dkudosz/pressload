import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Puzzle } from 'lucide-react'
import { getAllPlugins } from '@/lib/actions/plugins'
import { PluginToggle } from '@/components/admin/plugin-toggle'

export default async function PluginsPage() {
  const pluginList = await getAllPlugins()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plugins</h1>
        <p className="text-muted-foreground mt-1">Extend Pressload with plugins.</p>
      </div>

      {pluginList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No plugins installed</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add plugin folders to the <code className="text-xs bg-muted px-1 py-0.5 rounded">plugins/</code> directory.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pluginList.map((plugin) => (
            <Card
              key={plugin.manifest.name}
              className={plugin.isActive ? 'border-primary/30 bg-primary/5' : ''}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{plugin.manifest.name}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        v{plugin.manifest.version}
                      </Badge>
                      {plugin.isActive && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{plugin.manifest.description}</p>
                    {plugin.manifest.author && (
                      <p className="text-xs text-muted-foreground">By {plugin.manifest.author}</p>
                    )}
                    {plugin.manifest.adminPages && plugin.manifest.adminPages.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {plugin.manifest.adminPages.map((page) => (
                          <Badge key={page.slug} variant="secondary" className="text-xs">
                            {page.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <PluginToggle
                    name={plugin.manifest.name}
                    isActive={plugin.isActive}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        After activating or deactivating a plugin, restart the dev server for hooks to take effect.
      </p>
    </div>
  )
}
