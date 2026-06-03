import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/api/rate-limit'

const PROTECTED_PATHS = [
  '/dashboard',
  '/posts',
  '/pages',
  '/media',
  '/comments',
  '/users',
  '/plugins',
  '/themes',
  '/settings',
  '/profile',
]

// Auth routes: 20 attempts per 10 minutes per IP
const AUTH_RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate-limit authentication endpoints
  if (pathname.startsWith('/api/auth/callback') || pathname === '/api/auth/signin') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    if (!checkRateLimit(`auth:${ip}`, AUTH_RATE_LIMIT)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '600' },
      })
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected && !token) {
    const signinUrl = new URL('/signin', request.url)
    signinUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signinUrl)
  }

  // Redirect authenticated users away from signin
  if (pathname === '/signin' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
