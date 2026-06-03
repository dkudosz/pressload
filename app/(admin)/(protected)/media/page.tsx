import { getMediaItems } from '@/lib/actions/media'
import { MediaLibraryClient } from '@/components/admin/MediaLibraryClient'

export default async function MediaPage() {
  const items = await getMediaItems()
  return <MediaLibraryClient initialItems={items} />
}
