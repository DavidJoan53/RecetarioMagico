import 'server-only'
import {auth} from '@/auth'
import {isAllowedEmail} from './auth-policy'
import {env} from './env'

/**
 * The gate that actually matters.
 *
 * Middleware redirects unauthenticated *page* requests, which is the cosmetic
 * half — it stops someone seeing a screen. It does nothing for a direct call
 * to `/api/recipes`, because middleware can be bypassed by not using a
 * browser. So every route handler checks for itself, here.
 *
 * The allowlist is re-checked rather than trusted from sign-in: a JWT issued
 * before someone was removed from the list stays cryptographically valid
 * until it expires. Checking per request means removing an address takes
 * effect on the next call instead of whenever their cookie happens to lapse.
 */
export type Session = {email: string}

export async function getSession(): Promise<Session | null> {
  const session = await auth()
  const email = session?.user?.email
  if (!isAllowedEmail(email, env.ALLOWED_EMAILS)) return null
  // isAllowedEmail has already established this is a non-empty string.
  return {email: (email as string).trim().toLowerCase()}
}

export function unauthorized(): Response {
  return Response.json(
    {error: 'No autorizado'},
    {status: 401, headers: {'cache-control': 'no-store'}},
  )
}

type Handler<Ctx> = (
  request: Request,
  context: Ctx,
  session: Session,
) => Promise<Response> | Response

/**
 * Wraps a route handler so it cannot run without a session.
 *
 * Preferred over calling getSession() inside each handler: a forgotten call
 * is an open endpoint that looks exactly like a closed one in review, whereas
 * a handler that forgets this wrapper does not receive a session argument and
 * fails to typecheck.
 */
export function withAuth<Ctx>(handler: Handler<Ctx>) {
  return async (request: Request, context: Ctx): Promise<Response> => {
    const session = await getSession()
    if (!session) return unauthorized()
    return handler(request, context, session)
  }
}
