import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { getMenuById, addMenuItem, deleteMenu, updateMenuName, assignMenuLocation } from '@/lib/actions/menus'
import { MenuItemList } from '@/components/admin/menu-item-list'

const LOCATIONS = [
  { value: '', label: 'None' },
  { value: 'primary', label: 'Primary Navigation' },
  { value: 'footer', label: 'Footer' },
  { value: 'social', label: 'Social Links' },
]

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditMenuPage({ params }: Props) {
  const { id } = await params
  const menu = await getMenuById(id)
  if (!menu) notFound()

  const addItemAction = addMenuItem.bind(null, id)
  const renameAction = updateMenuName.bind(null, id)
  const assignAction = assignMenuLocation.bind(null, id)
  const deleteAction = deleteMenu.bind(null, id)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings/menus">
            <ArrowLeft className="h-4 w-4" />
            Menus
          </Link>
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Edit Menu</h2>
      </div>

      {/* Rename + location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Menu Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={renameAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Menu Name</Label>
              <Input id="name" name="name" defaultValue={menu.name} required />
            </div>
            <Button type="submit" size="sm">Rename</Button>
          </form>

          <form action={assignAction} className="space-y-3 pt-3 border-t border-border">
            <div className="space-y-2">
              <Label htmlFor="location">Assign to Theme Location</Label>
              <select
                id="location"
                name="location"
                defaultValue={menu.location}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LOCATIONS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">Save Location</Button>
          </form>
        </CardContent>
      </Card>

      {/* Menu items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Menu Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {menu.items.length > 0 ? (
            <MenuItemList items={menu.items} menuId={id} />
          ) : (
            <p className="text-sm text-muted-foreground">No items yet. Add one below.</p>
          )}

          <form action={addItemAction} className="space-y-3 pt-3 border-t border-border">
            <p className="text-sm font-medium text-foreground">Add New Item</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="label" className="text-xs">Label</Label>
                <Input id="label" name="label" placeholder="Home" required className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="url" className="text-xs">URL</Label>
                <Input id="url" name="url" placeholder="/" className="h-8 text-sm font-mono" />
              </div>
            </div>
            <Button type="submit" size="sm">Add Item</Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          <form action={deleteAction}>
            <Button type="submit" variant="destructive" size="sm">Delete Menu</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
