import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Auth routes handling
  if (request.nextUrl.pathname.startsWith('/auth')) {
    // Allow access to verify-email and callback pages even for authenticated users
    if (request.nextUrl.pathname.startsWith('/auth/verify-email') || 
        request.nextUrl.pathname.startsWith('/auth/callback')) {
      return response
    }
    
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Protected routes handling
  if (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/sessions') ||
    request.nextUrl.pathname.startsWith('/subjects') ||
    request.nextUrl.pathname.startsWith('/tutor-dashboard') ||
    request.nextUrl.pathname.startsWith('/tutor-profile') ||
    request.nextUrl.pathname.startsWith('/inbox')
    console.log("Pathname: ", request.nextUrl.pathname)
  ) {
    if (!session) {
      console.log('Redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/dashboard/:path*',
    '/tutor-dashboard/:path*',
    '/tutor-profile/:path*',
    '/inbox/:path*',
    '/sessions/:path*',
    '/subjects/:path*',
    '/profile/:path*',
  ],
} 