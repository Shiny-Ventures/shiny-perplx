import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip auth check if running on localhost
  const isLocalhost = req.url.includes('localhost') || req.url.includes('127.0.0.1')
  if (isLocalhost) {
    return res
  }

  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If there's no session and the user is trying to access a protected route
  if (!session && isProtectedRoute(req.nextUrl.pathname)) {
    const redirectUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Helper function to check if a route should be protected
function isProtectedRoute(pathname: string): boolean {
  // Remove /account from server-side protection since it's handled client-side
  const protectedRoutes = ['/dashboard', '/settings', '/api/query']
  return protectedRoutes.some(route => pathname.startsWith(route))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth routes (auth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
} 