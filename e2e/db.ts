import {neon} from '@neondatabase/serverless'
import {inArray} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/neon-http'
import {ingredients, recipeIngredients, recipes} from '@/db/schema'

/**
 * Built here rather than imported from @/db, which pulls in lib/env and its
 * `server-only` guard — that throws outside a server component.
 */
const db = drizzle(neon(process.env.DATABASE_URL as string))

/** Tests run in parallel against one branch, so names cannot collide. */
export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Neon is reached over HTTP and occasionally refuses a connection — scaling
 * from zero, mostly. Retried only here, in the fixtures: a flaky setup or
 * teardown should not read as a failure of the app, and the app's own calls
 * are left alone so that a real problem there still fails.
 */
async function resilient<T>(run: () => Promise<T>): Promise<T> {
  let last: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await run()
    } catch (error) {
      last = error
      await new Promise(r => setTimeout(r, 250 * 2 ** attempt))
    }
  }
  throw last
}

export async function addIngredient(name: string): Promise<string> {
  const [row] = await resilient(() =>
    db.insert(ingredients).values({name}).returning({id: ingredients.id}),
  )
  if (!row) throw new Error(`could not add ${name}`)
  return row.id
}

/** Puts an ingredient behind the ON DELETE RESTRICT the UI has to report. */
export async function useInNewRecipe(
  ingredientId: string,
  recipeName: string,
): Promise<string> {
  const [recipe] = await resilient(() =>
    db.insert(recipes).values({name: recipeName}).returning({id: recipes.id}),
  )
  if (!recipe) throw new Error(`could not add ${recipeName}`)

  await resilient(() =>
    db.insert(recipeIngredients).values({
      recipeId: recipe.id,
      ingredientId,
      unit: 'g',
      quantity: 100,
    }),
  )
  return recipe.id
}

/** Recipes first: recipe_ingredients is what holds the ingredient down. */
export async function removeAll(created: {
  recipeIds: string[]
  ingredientNames: string[]
}): Promise<void> {
  if (created.recipeIds.length > 0) {
    await resilient(() =>
      db.delete(recipes).where(inArray(recipes.id, created.recipeIds)),
    )
  }
  if (created.ingredientNames.length > 0) {
    /* One statement, not one per name — every round trip is a chance to fail. */
    await resilient(() =>
      db
        .delete(ingredients)
        .where(inArray(ingredients.name, created.ingredientNames)),
    )
  }
}
