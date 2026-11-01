import {z} from 'zod'

/** Ten fills the list box without making the first open wait on the rest. */
export const PAGE_SIZE = 10

export const ingredientSearch = z.object({
  /** Blank means unfiltered, so an empty box is a valid search. */
  query: z.string().trim().max(120).default(''),
  after: z.string().trim().min(1).nullable().default(null),
})

export type IngredientSearch = z.infer<typeof ingredientSearch>

export function ingredientSearchFrom(params: URLSearchParams) {
  return ingredientSearch.safeParse({
    query: params.get('query') ?? '',
    after: params.get('after') || null,
  })
}
