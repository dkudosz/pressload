import { createClient } from '@supabase/supabase-js'

const BUCKET = 'pressload-media'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  return createClient(url, key)
}

export async function uploadFile(
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<{ url: string; path: string }> {
  const supabase = getClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return { url: getPublicUrl(path), path }
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}

export function getPublicUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  return `${url}/storage/v1/object/public/${BUCKET}/${path}`
}

export function buildUploadPath(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `uploads/${year}/${month}/${Date.now()}-${sanitized}`
}
