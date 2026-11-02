import {pantryPage} from '@/db/pantry/queries'
import {withAuth} from '@/lib/session'
import {cursorFrom, PAGE_SIZE} from '@/lib/validation/page'

/**
 * Read-only, but still gated: the proxy only stops a browser, and this
 * returns what is in the house.
 */
export const GET = withAuth(async (request: Request) => {
  const parsed = cursorFrom(new URL(request.url).searchParams)
  if (!parsed.success) {
    return Response.json({error: 'invalid'}, {status: 400})
  }

  const page = await pantryPage({...parsed.data, limit: PAGE_SIZE})
  return Response.json(page, {headers: {'cache-control': 'no-store'}})
})
