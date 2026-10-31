import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import {isAllowedEmail} from '@/lib/auth-policy'
import {env} from '@/lib/env'

/**
 * Auth.js v5.
 *
 * Still beta — there is no stable v5, and v4 predates the App Router, so this
 * is the version that fits. Recorded in README under the stack.
 *
 * No database adapter: the session is a JWT in an httpOnly cookie. A
 * single-user app gains nothing from a sessions table, and skipping it means
 * no database round trip to answer "who is signed in".
 *
 * AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET are picked up from the
 * environment by name — Auth.js finds them without being told where.
 */
export const {handlers, auth, signIn, signOut} = NextAuth({
  providers: [GitHub],
  // The sign-in screen is the root route, not Auth.js's generated page. Errors
  // land there too, so a refused account sees the same screen rather than a
  // framework page that leaks which stage failed.
  pages: {signIn: '/', error: '/'},
  callbacks: {
    /**
     * The first gate. Refusing here means an address outside the allowlist
     * never receives a session at all — rather than receiving one that later
     * checks have to keep rejecting.
     */
    signIn({profile}) {
      return isAllowedEmail(profile?.email, env.ALLOWED_EMAILS)
    },

    /**
     * Carry the email onto the token. Without this the JWT holds the provider
     * id and nothing else useful, and every later check would need a lookup.
     */
    jwt({token, profile}) {
      if (profile?.email) token.email = profile.email
      return token
    },

    session({session, token}) {
      if (token.email) session.user.email = token.email
      return session
    },
  },
})
