import {searchIngredients} from '@/db/ingredients/queries'
import {withAuth} from '@/lib/session'
import {
  ingredientSearchFrom,
  PAGE_SIZE,
} from '@/lib/validation/ingredient-search'

/**
 * Read-only, but still gated: the proxy only stops a browser, and this
 * returns what is in the house.
 */
export const GET = withAuth(async (request: Request) => {
  const parsed = ingredientSearchFrom(new URL(request.url).searchParams)
  if (!parsed.success) {
    return Response.json({error: 'invalid'}, {status: 400})
  }

  const page = await searchIngredients({...parsed.data, limit: PAGE_SIZE})
  return Response.json(page, {headers: {'cache-control': 'no-store'}})
})
