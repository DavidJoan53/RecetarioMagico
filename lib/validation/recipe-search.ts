import {z} from 'zod'
import {cursorPage} from './page'

/** The recipe list, with a name to narrow it by. */
export const recipeSearch = cursorPage.extend({
  /** Blank means unfiltered, so the list and the picker are one endpoint. */
  query: z.string().trim().max(200).default(''),
})

export type RecipeSearch = z.infer<typeof recipeSearch>

export function recipeSearchFrom(params: URLSearchParams) {
  return recipeSearch.safeParse({
    query: params.get('query') ?? '',
    after: params.get('after') || null,
  })
}
