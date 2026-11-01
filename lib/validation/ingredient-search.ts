import {z} from 'zod'

/** Twenty fills a scroll viewport without making the first paint wait. */
export const PAGE_SIZE = 20

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
