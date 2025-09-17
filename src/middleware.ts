import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login page
  if (user && pathname === '/login') {
    // Get user profile to determine redirect destination
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const dashboardUrl = profile.role === 'admin' 
        ? new URL('/admin', request.url)
        : new URL('/collector', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Role-based route protection
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Admin routes
      if (pathname.startsWith('/admin') && profile.role !== 'admin') {
        const collectorUrl = new URL('/collector', request.url)
        return NextResponse.redirect(collectorUrl)
      }

      // Collector routes
      if (pathname.startsWith('/collector') && profile.role !== 'collector') {
        const adminUrl = new URL('/admin', request.url)
        return NextResponse.redirect(adminUrl)
      }

      // Redirect root to appropriate dashboard
      if (pathname === '/') {
        const dashboardUrl = profile.role === 'admin' 
          ? new URL('/admin', request.url)
          : new URL('/collector', request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}