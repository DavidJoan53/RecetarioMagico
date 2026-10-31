import {NextResponse} from 'next/server'
import {auth} from '@/auth'

/**
 * Redirects unauthenticated page requests. Cosmetic only — a direct request
 * bypasses this, so route handlers re-check via withAuth.
 */
export default auth(request => {
  const signedIn = Boolean(request.auth?.user?.email)
  const {pathname} = request.nextUrl

  if (pathname === '/') {
    return signedIn
      ? NextResponse.redirect(new URL('/home', request.nextUrl))
      : NextResponse.next()
  }

  if (!signedIn) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  /** Deny by default: a new route is private before anyone adds it here. */
  matcher: ['/((?!api/auth|_next/static|_next/image|.*\\.[\\w]+$).*)'],
}
