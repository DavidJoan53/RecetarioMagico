import {z} from 'zod'

/** Ten fills a screen without making the first view wait on the rest. */
export const PAGE_SIZE = 10

/**
 * Every paged list is keyset: the cursor is the last value read, so what it
 * means is the list's business and all this knows is that it is a non-empty
 * string.
 */
export const cursorPage = z.object({
  after: z.string().trim().min(1).nullable().default(null),
})

export type CursorPage = z.infer<typeof cursorPage>

export function cursorFrom(params: URLSearchParams) {
  /* Blank is the beginning, not a row whose cursor is the empty string. */
  return cursorPage.safeParse({after: params.get('after') || null})
}

/** What every paged endpoint returns, whatever it is a page of. */
export type Page<T> = {
  items: T[]
  /** The cursor to continue from, or null at the end. */
  nextCursor: string | null
}

/**
 * Turns limit + 1 rows into a page. Asking for one more than is shown is what
 * answers "is there another" without a second count query.
 */
export function pageOf<T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string,
): {items: T[]; nextCursor: string | null} {
  const items = rows.slice(0, limit)
  const last = items.at(-1)
  return {
    items,
    nextCursor: rows.length > limit && last ? cursorOf(last) : null,
  }
}
