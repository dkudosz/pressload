'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { menus, menuItems } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export interface MenuItem {
  id: string
  label: string
  url: string
  parentId: string | null
  menuOrder: number
}

export interface Menu {
  id: string
  name: string
  slug: string
  location: string
  items: MenuItem[]
}

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function loadItems(menuId: string): Promise<MenuItem[]> {
  const rows = await db.query.menuItems.findMany({
    where: eq(menuItems.menuId, menuId),
    orderBy: [asc(menuItems.menuOrder)],
  })
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    url: r.url ?? '',
    parentId: r.parentId ?? null,
    menuOrder: r.menuOrder,
  }))
}

export async function getMenus(): Promise<Menu[]> {
  const all = await db.query.menus.findMany({ orderBy: [asc(menus.createdAt)] })
  return Promise.all(
    all.map(async (m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      location: m.location ?? '',
      items: await loadItems(m.id),
    })),
  )
}

export async function getMenuById(id: string): Promise<Menu | null> {
  const menu = await db.query.menus.findFirst({ where: eq(menus.id, id) })
  if (!menu) return null
  return {
    id: menu.id,
    name: menu.name,
    slug: menu.slug,
    location: menu.location ?? '',
    items: await loadItems(menu.id),
  }
}

export async function getMenuByLocation(location: string): Promise<Menu | null> {
  const menu = await db.query.menus.findFirst({ where: eq(menus.location, location) })
  if (!menu) return null
  return {
    id: menu.id,
    name: menu.name,
    slug: menu.slug,
    location: menu.location ?? '',
    items: await loadItems(menu.id),
  }
}

export async function createMenu(formData: FormData): Promise<void> {
  await requireAuth()
  const name = (formData.get('name') as string) ?? ''
  if (!name.trim()) throw new Error('Menu name is required')
  const slug = toSlug(name) || 'menu'
  const [menu] = await db.insert(menus).values({ name: name.trim(), slug }).returning()
  revalidatePath('/settings/menus')
  redirect(`/settings/menus/${menu.id}`)
}

export async function updateMenuName(id: string, formData: FormData): Promise<void> {
  await requireAuth()
  const name = (formData.get('name') as string) ?? ''
  if (!name.trim()) throw new Error('Menu name is required')
  await db.update(menus).set({ name: name.trim(), slug: toSlug(name) }).where(eq(menus.id, id))
  revalidatePath('/settings/menus')
  revalidatePath(`/settings/menus/${id}`)
}

export async function deleteMenu(id: string): Promise<void> {
  await requireAuth()
  await db.delete(menus).where(eq(menus.id, id))
  revalidatePath('/settings/menus')
  redirect('/settings/menus')
}

export async function assignMenuLocation(id: string, formData: FormData): Promise<void> {
  await requireAuth()
  const location = (formData.get('location') as string) ?? ''

  // Unassign any other menu with the same non-empty location
  if (location) {
    await db.update(menus).set({ location: '' }).where(eq(menus.location, location))
  }

  await db.update(menus).set({ location }).where(eq(menus.id, id))
  revalidatePath('/settings/menus')
  revalidatePath(`/settings/menus/${id}`)
  revalidatePath('/')
}

export async function addMenuItem(menuId: string, formData: FormData): Promise<void> {
  await requireAuth()
  const label = (formData.get('label') as string) ?? ''
  const url = (formData.get('url') as string) ?? ''
  if (!label.trim()) throw new Error('Label is required')

  const existing = await db.query.menuItems.findMany({
    where: eq(menuItems.menuId, menuId),
    columns: { menuOrder: true },
  })
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.menuOrder), -1)

  await db.insert(menuItems).values({
    menuId,
    label: label.trim(),
    url: url.trim(),
    menuOrder: maxOrder + 1,
  })
  revalidatePath(`/settings/menus/${menuId}`)
}

export async function updateMenuItem(itemId: string, formData: FormData): Promise<void> {
  await requireAuth()
  const label = (formData.get('label') as string) ?? ''
  const url = (formData.get('url') as string) ?? ''
  await db
    .update(menuItems)
    .set({ label: label.trim(), url: url.trim() })
    .where(eq(menuItems.id, itemId))
  const item = await db.query.menuItems.findFirst({ where: eq(menuItems.id, itemId), columns: { menuId: true } })
  if (item) revalidatePath(`/settings/menus/${item.menuId}`)
}

export async function removeMenuItem(itemId: string): Promise<void> {
  await requireAuth()
  const item = await db.query.menuItems.findFirst({ where: eq(menuItems.id, itemId), columns: { menuId: true } })
  await db.delete(menuItems).where(eq(menuItems.id, itemId))
  if (item) revalidatePath(`/settings/menus/${item.menuId}`)
  revalidatePath('/')
}

export async function moveMenuItemUp(itemId: string): Promise<void> {
  await requireAuth()
  const item = await db.query.menuItems.findFirst({ where: eq(menuItems.id, itemId) })
  if (!item) return

  const prev = await db.query.menuItems.findFirst({
    where: eq(menuItems.menuId, item.menuId),
    columns: { id: true, menuOrder: true },
    orderBy: [asc(menuItems.menuOrder)],
  })

  // Find the item just above (order < current)
  const allItems = await db.query.menuItems.findMany({
    where: eq(menuItems.menuId, item.menuId),
    orderBy: [asc(menuItems.menuOrder)],
  })
  const idx = allItems.findIndex((r) => r.id === itemId)
  if (idx <= 0) return

  const above = allItems[idx - 1]
  await db.update(menuItems).set({ menuOrder: above.menuOrder }).where(eq(menuItems.id, itemId))
  await db.update(menuItems).set({ menuOrder: item.menuOrder }).where(eq(menuItems.id, above.id))
  revalidatePath(`/settings/menus/${item.menuId}`)
  revalidatePath('/')
}

export async function moveMenuItemDown(itemId: string): Promise<void> {
  await requireAuth()
  const item = await db.query.menuItems.findFirst({ where: eq(menuItems.id, itemId) })
  if (!item) return

  const allItems = await db.query.menuItems.findMany({
    where: eq(menuItems.menuId, item.menuId),
    orderBy: [asc(menuItems.menuOrder)],
  })
  const idx = allItems.findIndex((r) => r.id === itemId)
  if (idx >= allItems.length - 1) return

  const below = allItems[idx + 1]
  await db.update(menuItems).set({ menuOrder: below.menuOrder }).where(eq(menuItems.id, itemId))
  await db.update(menuItems).set({ menuOrder: item.menuOrder }).where(eq(menuItems.id, below.id))
  revalidatePath(`/settings/menus/${item.menuId}`)
  revalidatePath('/')
}
