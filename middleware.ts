import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard',
  '/posts',
  '/pages',
  '/media',
  '/users',
  '/plugins',
  '/themes',
  '/settings',
]

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })

  const { pathname } = request.nextUrl
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|install).*)'],
}
