import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protected routes
  const isAdminRoute = path.startsWith('/admin')
  const isClientRoute = path.startsWith('/client')

  // If accessing protected route without authentication, redirect to signin
  if ((isAdminRoute || isClientRoute) && !user) {
    const redirectUrl = new URL('/signin', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated, check role-based access
  if (user && (isAdminRoute || isClientRoute)) {
    // Determine user role
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'gbsullivan@mac.com'
    const isAdmin = user.email === adminEmail

    // Check database for role if not admin by email
    let role: 'admin' | 'client' = 'client'
    if (isAdmin) {
      role = 'admin'
    } else {
      const { data: userData } = await supabase
        .from('gsrealty_users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      role = userData?.role === 'admin' ? 'admin' : 'client'
    }

    // Enforce role-based access
    if (isAdminRoute && role !== 'admin') {
      // Non-admin trying to access admin route - redirect to client dashboard
      return NextResponse.redirect(new URL('/client', request.url))
    }

    if (isClientRoute && role === 'admin') {
      // Admin trying to access client route - allow (admin can see both)
      // Admin has access to everything, so we allow this
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
