import { type NextRequest } from 'next/server'
import { getMenuByLocation } from '@/lib/actions/menus'
import { ok, notFound, serverError } from '@/lib/api/response'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ location: string }> },
) {
  try {
    const { location } = await params
    const menu = await getMenuByLocation(location)
    if (!menu) return notFound('Menu')

    return ok({
      id: menu.id,
      name: menu.name,
      location: menu.location,
      items: menu.items.map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        order: item.menuOrder,
        parent: item.parentId ?? null,
      })),
    })
  } catch {
    return serverError()
  }
}
