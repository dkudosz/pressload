import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.zip': 'application/zip',
  }
  return mimes[ext] ?? 'application/octet-stream'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await params
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? './uploads')
  const requestedPath = path.resolve(uploadsDir, ...pathParts)

  // Prevent path traversal
  const relative = path.relative(uploadsDir, requestedPath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const data = await fs.readFile(requestedPath)
    return new NextResponse(data, {
      headers: {
        'Content-Type': getMimeType(requestedPath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
