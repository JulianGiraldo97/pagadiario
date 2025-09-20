import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security logging utility
function logSecurityEvent(event: string, details: any) {
  // Security events are logged internally but not to console in production
  // In production, these would be sent to a monitoring service
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString()
    console.log(`[SECURITY] ${timestamp} - ${event}:`, JSON.stringify(details))
  }
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const key = `rate_limit_${ip}`
  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= limit) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, count: current.count, limit })
    return false
  }

  current.count++
  return true
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Rate limiting check
  if (!checkRateLimit(ip)) {
    logSecurityEvent('RATE_LIMIT_BLOCKED', { ip, path: request.nextUrl.pathname })
    return new NextResponse('Too Many Requests', { status: 429 })
  }

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

  // Admin-only routes that require strict validation
  const adminOnlyRoutes = ['/admin/reports', '/admin/collectors', '/admin/routes']
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))

  // Critical routes that require additional logging
  const criticalRoutes = ['/admin/reports', '/admin/clients', '/collector/payments']
  const isCriticalRoute = criticalRoutes.some(route => pathname.startsWith(route))

  // Log access attempts to critical routes
  if (isCriticalRoute) {
    logSecurityEvent('CRITICAL_ROUTE_ACCESS', {
      path: pathname,
      ip,
      userAgent,
      userId: user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    })
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      path: pathname,
      ip,
      userAgent
    })
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

  // Enhanced role-based route protection
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      logSecurityEvent('PROFILE_NOT_FOUND', {
        userId: user.id,
        path: pathname,
        ip
      })
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Strict admin route protection
    if (pathname.startsWith('/admin') && profile.role !== 'admin') {
      logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', {
        userId: user.id,
        userRole: profile.role,
        path: pathname,
        ip,
        userAgent
      })
      const collectorUrl = new URL('/collector', request.url)
      return NextResponse.redirect(collectorUrl)
    }

    // Enhanced admin-only route protection
    if (isAdminOnlyRoute && profile.role !== 'admin') {
      logSecurityEvent('ADMIN_ONLY_ROUTE_VIOLATION', {
        userId: user.id,
        userRole: profile.role,
        path: pathname,
        ip,
        userAgent
      })
      const collectorUrl = new URL('/collector', request.url)
      return NextResponse.redirect(collectorUrl)
    }

    // Collector routes protection
    if (pathname.startsWith('/collector') && profile.role !== 'collector') {
      logSecurityEvent('UNAUTHORIZED_COLLECTOR_ACCESS', {
        userId: user.id,
        userRole: profile.role,
        path: pathname,
        ip
      })
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

    // Log successful access to protected routes
    if (isCriticalRoute) {
      logSecurityEvent('AUTHORIZED_ACCESS', {
        userId: user.id,
        userRole: profile.role,
        path: pathname,
        ip,
        responseTime: Date.now() - startTime
      })
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