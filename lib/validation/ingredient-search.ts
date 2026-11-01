import {z} from 'zod'
import {cursorPage} from './page'

/** The same search, with a name to narrow it by. */
export const ingredientSearch = cursorPage.extend({
  /** Blank means unfiltered, so an empty box is a valid search. */
  query: z.string().trim().max(120).default(''),
})

export type IngredientSearch = z.infer<typeof ingredientSearch>

export function ingredientSearchFrom(params: URLSearchParams) {
  return ingredientSearch.safeParse({
    query: params.get('query') ?? '',
    after: params.get('after') || null,
  })
}
