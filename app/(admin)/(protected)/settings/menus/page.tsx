import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink } from 'lucide-react'
import { getMenus, createMenu } from '@/lib/actions/menus'

const LOCATIONS = [
  { value: 'primary', label: 'Primary Navigation' },
  { value: 'footer', label: 'Footer' },
  { value: 'social', label: 'Social Links' },
]

export default async function MenusPage() {
  const menuList = await getMenus()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Menus</h2>
        <p className="text-sm text-muted-foreground mt-1">Create and manage navigation menus.</p>
      </div>

      {/* Create menu */}
      <Card>
        <CardContent className="pt-6">
          <form action={createMenu} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">New Menu Name</Label>
              <Input id="name" name="name" placeholder="Primary Navigation" required />
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Create Menu
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Menu list */}
      {menuList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No menus yet. Create one above.</p>
      ) : (
        <div className="space-y-3">
          {menuList.map((menu) => (
            <Card key={menu.id}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{menu.name}</span>
                    {menu.location && (
                      <Badge variant="secondary" className="text-xs">
                        {LOCATIONS.find((l) => l.value === menu.location)?.label ?? menu.location}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {menu.items.length} item{menu.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/settings/menus/${menu.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
