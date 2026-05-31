import { Card, CardContent } from '@/components/ui/card'
import { Palette } from 'lucide-react'

export default function ThemesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Themes</h1>
        <p className="text-muted-foreground mt-1">Customise your site&apos;s appearance.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Palette className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Theme system</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Theme switching, customiser, and the default theme — coming in Phase 6.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
