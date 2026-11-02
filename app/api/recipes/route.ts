import {recipesPage} from '@/db/recipes/queries'
import {withAuth} from '@/lib/session'
import {PAGE_SIZE} from '@/lib/validation/page'
import {recipeSearchFrom} from '@/lib/validation/recipe-search'

/**
 * Read-only, but still gated: the proxy only stops a browser, and this
 * returns what someone cooks.
 */
export const GET = withAuth(async (request: Request) => {
  const parsed = recipeSearchFrom(new URL(request.url).searchParams)
  if (!parsed.success) {
    return Response.json({error: 'invalid'}, {status: 400})
  }

  const page = await recipesPage({...parsed.data, limit: PAGE_SIZE})
  return Response.json(page, {headers: {'cache-control': 'no-store'}})
})
