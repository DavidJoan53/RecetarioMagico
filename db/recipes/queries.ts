import {and, asc, desc, eq, ilike, inArray, lt} from 'drizzle-orm'
import {db} from '@/db'
import type {Label, Unit} from '@/db/schema'
import {
  ingredients,
  labels,
  recipeIngredients,
  recipeLabels,
  recipes,
} from '@/db/schema'
import {pageOf} from '@/lib/validation/page'

/** One ordering, one cursor: the list and the picker read the same rows. */
function recipeRows({
  after,
  limit,
  query,
}: {
  after: string | null
  limit: number
  query: string
}) {
  return db
    .select()
    .from(recipes)
    .where(
      and(
        query ? ilike(recipes.name, `%${query}%`) : undefined,
        after ? lt(recipes.id, after) : undefined,
      ),
    )
    .orderBy(desc(recipes.id))
    .limit(limit)
}

/** An ingredient as it reads inside a recipe: the name, and how much of it. */
export type RecipeIngredient = {
  ingredientId: string
  name: string
  quantity: number
  unit: Unit
}

export type Recipe = typeof recipes.$inferSelect

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[]
}

/**
 * One recipe, whole: what the detail page shows and what the edit form
 * starts as. The labels stay off the list types — a page of ten would read
 * them to render nothing, since the cards show a thumbnail and a time.
 */
export type RecipeDetail = RecipeWithIngredients & {
  labels: Label[]
}

/**
 * Alphabetical, not by when the row was written. A multi-row insert stamps
 * every id in the same millisecond, so uuid v7 leaves the order inside one
 * recipe to the random bits — stable on paper, shuffled in practice.
 */
function ingredientRowsFor(recipeIds: string[]) {
  return db
    .select({
      recipeId: recipeIngredients.recipeId,
      ingredientId: recipeIngredients.ingredientId,
      name: ingredients.name,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(ingredients.id, recipeIngredients.ingredientId))
    .where(inArray(recipeIngredients.recipeId, recipeIds))
    .orderBy(asc(ingredients.name))
}

/**
 * One query for the whole page, grouped here — a page of ten must not become
 * ten more round trips.
 */
async function ingredientsByRecipe(
  recipeIds: string[],
): Promise<Map<string, RecipeIngredient[]>> {
  const grouped = new Map<string, RecipeIngredient[]>()
  if (recipeIds.length === 0) return grouped

  for (const {recipeId, ...ingredient} of await ingredientRowsFor(recipeIds)) {
    const existing = grouped.get(recipeId)
    if (existing) existing.push(ingredient)
    else grouped.set(recipeId, [ingredient])
  }
  return grouped
}

function withIngredients(
  rows: Recipe[],
  byRecipe: Map<string, RecipeIngredient[]>,
): RecipeWithIngredients[] {
  return rows.map(row => ({...row, ingredients: byRecipe.get(row.id) ?? []}))
}

/**
 * Keyset, not OFFSET: uuid v7 sorts chronologically and does not drift.
 *
 * Names only. This feeds the home strip, which has room for a thumbnail and
 * a time and nothing else, so reading the amounts would be work thrown away.
 */
export async function latestRecipes(limit: number, before?: string) {
  return recipeRows({after: before ?? null, limit, query: ''})
}

export type RecipePage = {
  items: RecipeWithIngredients[]
  /** The id of the last recipe on the page, or null at the end. */
  nextCursor: string | null
}

/**
 * The same list, a page at a time. The cursor is the last id read: v7 ids
 * sort by when they were made, so "older than this one" is exactly where to
 * continue — and a recipe created while you read cannot push a row onto a
 * page already passed, the way an OFFSET would.
 *
 * A name narrows it without changing any of that: the order is still by id,
 * so the cursor means the same thing filtered or not.
 */
export async function recipesPage({
  after,
  limit,
  query = '',
}: {
  after: string | null
  limit: number
  query?: string
}): Promise<RecipePage> {
  const rows = await recipeRows({after, limit: limit + 1, query})
  const page = pageOf(rows, limit, row => row.id)
  const byRecipe = await ingredientsByRecipe(page.items.map(r => r.id))
  return {...page, items: withIngredients(page.items, byRecipe)}
}

/**
 * The labels on one recipe, by name — the order the picker lists them in, so
 * what is ticked and what is shown read the same way round.
 */
function labelsFor(recipeId: string) {
  return db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
      labelGroupId: labels.labelGroupId,
    })
    .from(recipeLabels)
    .innerJoin(labels, eq(labels.id, recipeLabels.labelId))
    .where(eq(recipeLabels.recipeId, recipeId))
    .orderBy(asc(labels.name))
}

/** Null rather than a throw: a recipe can be deleted while its link is open. */
export async function recipeById(id: string): Promise<RecipeDetail | null> {
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id))
  if (!recipe) return null

  const [rows, labelRows] = await Promise.all([
    ingredientRowsFor([id]),
    labelsFor(id),
  ])
  return {
    ...recipe,
    ingredients: rows.map(({recipeId: _, ...rest}) => rest),
    labels: labelRows,
  }
}
