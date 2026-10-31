import {NextResponse} from 'next/server'
import {auth} from '@/auth'

/**
 * The first of two gates, and the weaker one.
 *
 * Named proxy.ts rather than middleware.ts: Next 16 deprecated the middleware
 * file convention in favour of this one. Same behaviour and the same matcher —
 * only the filename changed.
 *
 * This stops an unauthenticated browser from *seeing* a page. It does not
 * protect data: middleware is bypassed by calling an endpoint directly, so
 * every route handler re-checks for itself via withAuth in lib/session.
 *
 * Deny by default. The matcher below excludes the few paths that must stay
 * reachable, so a new route is private the moment it exists rather than
 * waiting for someone to remember to add it to a list.
 */
export default auth(request => {
  const signedIn = Boolean(request.auth?.user?.email)
  const {pathname} = request.nextUrl

  // The sign-in screen. Already signed in? Nothing to do here.
  if (pathname === '/') {
    if (signedIn) {
      return NextResponse.redirect(new URL('/inicio', request.nextUrl))
    }
    return NextResponse.next()
  }

  if (!signedIn) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Everything except:
     *   api/auth  — the sign-in flow itself, which must work while signed out
     *   _next/*   — build output and generated images
     *   files with an extension — favicon, icons, anything static
     */
    '/((?!api/auth|_next/static|_next/image|.*\\.[\\w]+$).*)',
  ],
}
