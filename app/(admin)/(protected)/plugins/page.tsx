import { Card, CardContent } from '@/components/ui/card'
import { Puzzle } from 'lucide-react'

export default function PluginsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plugins</h1>
        <p className="text-muted-foreground mt-1">Extend Pressload with plugins.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Plugin system</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Plugin activation, management, and the hook API — coming in Phase 6.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
