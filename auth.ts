import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import {isAllowedEmail} from '@/lib/auth-policy'
import {env} from '@/lib/env'

/** No adapter: the session is a JWT cookie, so sign-in costs no query. */
export const {handlers, auth, signIn, signOut} = NextAuth({
  providers: [GitHub],
  /** Errors land on the sign-in page rather than leaking which stage failed. */
  pages: {signIn: '/', error: '/'},
  callbacks: {
    /** First gate: a refused address never receives a session at all. */
    signIn({profile}) {
      return isAllowedEmail(profile?.email, env.ALLOWED_EMAILS)
    },
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
