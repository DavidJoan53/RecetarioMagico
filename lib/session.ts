import 'server-only'
import {getTranslations} from 'next-intl/server'
import {auth} from '@/auth'
import {isAllowedEmail} from './auth-policy'
import {env} from './env'

export type Session = {email: string}

/**
 * The gate that holds. proxy.ts only stops a browser seeing a page; a direct
 * request bypasses it. The allowlist is re-checked because a JWT issued
 * before someone was removed stays valid until it expires.
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth()
  const email = session?.user?.email
  if (!isAllowedEmail(email, env.ALLOWED_EMAILS)) return null
  return {email: (email as string).trim().toLowerCase()}
}

export async function unauthorized(): Promise<Response> {
  const t = await getTranslations('auth')
  return Response.json(
    {error: t('unauthorized')},
    {status: 401, headers: {'cache-control': 'no-store'}},
  )
}

type Handler<Ctx> = (
  request: Request,
  context: Ctx,
  session: Session,
) => Promise<Response> | Response

/**
 * A handler that skips this gets no session argument and fails to typecheck,
 * so the check cannot be forgotten.
 */
export function withAuth<Ctx>(handler: Handler<Ctx>) {
  return async (request: Request, context: Ctx): Promise<Response> => {
    const session = await getSession()
    if (!session) return unauthorized()
    return handler(request, context, session)
  }
}
