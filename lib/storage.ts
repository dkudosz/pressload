import fs from 'fs/promises'
import path from 'path'

function getUploadsDir(): string {
  return path.resolve(process.env.UPLOADS_DIR ?? './uploads')
}

export async function uploadFile(
  buffer: Buffer,
  filePath: string,
  _contentType: string,
): Promise<{ url: string; path: string }> {
  const uploadsDir = getUploadsDir()
  const dest = path.join(uploadsDir, filePath)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.writeFile(dest, buffer)
  return { url: getPublicUrl(filePath), path: filePath }
}

export async function deleteFile(filePath: string): Promise<void> {
  const uploadsDir = getUploadsDir()
  const dest = path.join(uploadsDir, filePath)
  await fs.unlink(dest).catch(() => {})
}

export function getPublicUrl(filePath: string): string {
  return `/api/uploads/${filePath}`
}

export function buildUploadPath(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${year}/${month}/${Date.now()}-${sanitized}`
}
