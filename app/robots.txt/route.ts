import { NextResponse } from 'next/server'
import { getOption } from '@/lib/options'

export const dynamic = 'force-dynamic'

export async function GET() {
  const siteUrl = await getOption('siteurl', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /install/',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n')

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
