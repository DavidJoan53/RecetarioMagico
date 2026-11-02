import {dinnersPage} from '@/db/dinners/queries'
import {decodeDinnerCursor} from '@/lib/dinners'
import {withAuth} from '@/lib/session'
import {cursorFrom, PAGE_SIZE} from '@/lib/validation/page'

/**
 * Read-only, but still gated: the proxy only stops a browser, and this
 * returns what someone ate.
 */
export const GET = withAuth(async (request: Request) => {
  const parsed = cursorFrom(new URL(request.url).searchParams)
  if (!parsed.success) {
    return Response.json({error: 'invalid'}, {status: 400})
  }

  /* 400, not the first page. Falling back would have the infinite list
     append page one below itself for as long as anyone kept scrolling. */
  const after = parsed.data.after && decodeDinnerCursor(parsed.data.after)
  if (after === null && parsed.data.after !== null) {
    return Response.json({error: 'invalid'}, {status: 400})
  }

  const page = await dinnersPage({after: after || null, limit: PAGE_SIZE})
  return Response.json(page, {headers: {'cache-control': 'no-store'}})
})
