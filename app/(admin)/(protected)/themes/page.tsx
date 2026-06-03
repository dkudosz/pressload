import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Palette, CheckCircle2 } from 'lucide-react'
import { getAllThemes } from '@/lib/actions/themes'
import { ThemeActivate } from '@/components/admin/theme-activate'

export default async function ThemesPage() {
  const themeList = await getAllThemes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Themes</h1>
        <p className="text-muted-foreground mt-1">Customise your site&apos;s appearance.</p>
      </div>

      {themeList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No themes installed</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add theme folders to the <code className="text-xs bg-muted px-1 py-0.5 rounded">themes/</code> directory.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themeList.map((theme) => (
            <Card
              key={theme.manifest.name}
              className={theme.isActive ? 'border-primary ring-2 ring-primary/20' : ''}
            >
              {/* Screenshot placeholder */}
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                <Palette className="h-10 w-10 text-muted-foreground/40" />
                {theme.isActive && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </div>
                )}
              </div>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{theme.manifest.name}</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    v{theme.manifest.version}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {theme.manifest.description}
                </p>
                {theme.manifest.supports && theme.manifest.supports.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {theme.manifest.supports.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs font-normal">
                        {feature}
                      </Badge>
                    ))}
                    {theme.manifest.supports.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        +{theme.manifest.supports.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                {!theme.isActive && (
                  <ThemeActivate name={theme.manifest.name} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
