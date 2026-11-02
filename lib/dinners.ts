export type DinnerRecipe = {id: string; name: string; imageUrl: string | null}

export type DinnerWithRecipes = {
  id: string
  eatenAt: Date
  notes: string | null
  recipes: DinnerRecipe[]
}

export type DinnerJoinRow = {
  id: string
  eatenAt: Date
  notes: string | null
  recipeId: string | null
  recipeName: string | null
  recipeImage: string | null
}

/** The join yields one row per recipe; the UI wants one per dinner. */
export function groupByDinner(rows: DinnerJoinRow[]): DinnerWithRecipes[] {
  const byId = new Map<string, DinnerWithRecipes>()

  for (const row of rows) {
    let dinner = byId.get(row.id)
    if (!dinner) {
      dinner = {id: row.id, eatenAt: row.eatenAt, notes: row.notes, recipes: []}
      byId.set(row.id, dinner)
    }
    if (row.recipeId && row.recipeName) {
      dinner.recipes.push({
        id: row.recipeId,
        name: row.recipeName,
        imageUrl: row.recipeImage,
      })
    }
  }

  return [...byId.values()]
}

/**
 * What the paged list carries. `eatenAt` is an ISO string rather than a Date:
 * the first page arrives as a server prop and the rest as JSON, and a type
 * saying Date would be honest about only one of them.
 */
export type DinnerListItem = {
  id: string
  eatenAt: string
  notes: string | null
  recipes: DinnerRecipe[]
}

export type DinnerRow = {id: string; eatenAt: Date; notes: string | null}

export type DinnerRecipeRow = DinnerRecipe & {dinnerId: string}

/**
 * The recipes are read in a second query, not a join: a join with LIMIT cuts
 * a dinner in half at the page boundary. This puts them back.
 */
export function attachRecipes(
  dinners: DinnerRow[],
  rows: DinnerRecipeRow[],
): DinnerListItem[] {
  const byDinner = new Map<string, DinnerRecipe[]>()

  for (const {dinnerId, ...recipe} of rows) {
    const found = byDinner.get(dinnerId)
    if (found) found.push(recipe)
    else byDinner.set(dinnerId, [recipe])
  }

  return dinners.map(dinner => ({
    id: dinner.id,
    eatenAt: dinner.eatenAt.toISOString(),
    notes: dinner.notes,
    recipes: byDinner.get(dinner.id) ?? [],
  }))
}

export type DinnerCursor = {eatenAt: Date; id: string}

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

/**
 * Two parts, because eatenAt is not unique: two dinners at the same instant
 * would otherwise take turns being the last row read, and the page after
 * them would skip one and repeat the other forever.
 */
export function encodeDinnerCursor(row: DinnerCursor): string {
  return `${row.eatenAt.toISOString()}|${row.id}`
}

/** null for anything malformed — the caller answers 400 rather than guessing. */
export function decodeDinnerCursor(cursor: string): DinnerCursor | null {
  const [at, id, ...rest] = cursor.split('|')
  if (!at || !id || rest.length > 0 || !UUID.test(id)) return null
  const eatenAt = new Date(at)
  return Number.isNaN(eatenAt.getTime()) ? null : {eatenAt, id}
}

const DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

/**
 * `<input type="datetime-local">` has no timezone — what it reads and writes
 * is a wall clock. These two tie that clock to one named zone, the same one
 * the list is formatted in, so what is typed means one instant whatever zone
 * the browser happens to be in. Left to the server, "20:00" would be read as
 * UTC and the dinner would land hours from when it was eaten.
 */
export function toDateTimeLocal(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    /** h23, not hour12:false: that one renders midnight as 24. */
    hourCycle: 'h23',
  }).formatToParts(date)

  const at = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? '00'

  return `${at('year')}-${at('month')}-${at('day')}T${at('hour')}:${at('minute')}`
}

/** How far the zone is from UTC at that instant, in milliseconds. */
function offsetAt(instant: Date, timeZone: string): number {
  return (
    Date.parse(`${toDateTimeLocal(instant, timeZone)}:00Z`) - instant.getTime()
  )
}

export function fromDateTimeLocal(
  value: string,
  timeZone: string,
): Date | null {
  if (!DATETIME_LOCAL.test(value)) return null
  const asUtc = Date.parse(`${value}:00Z`)
  if (Number.isNaN(asUtc)) return null

  /* Looked up twice: once at a guess, then again at the answer. One pass is
     an hour out for the clock either side of a daylight-saving change, where
     the offset at the guess is not the offset at the instant meant. */
  const guess = asUtc - offsetAt(new Date(asUtc), timeZone)
  return new Date(asUtc - offsetAt(new Date(guess), timeZone))
}
