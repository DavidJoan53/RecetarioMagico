import {desc, eq, lt} from 'drizzle-orm'
import {db} from '@/db'
import {dinnerRecipes, dinners, recipes} from '@/db/schema'
import {type DinnerWithRecipes, groupByDinner} from '@/lib/dinners'

/** Ordered by eatenAt, which can differ from insertion order. */
export async function latestDinners(
  limit: number,
  before?: Date,
): Promise<DinnerWithRecipes[]> {
  const rows = await db
    .select({
      id: dinners.id,
      eatenAt: dinners.eatenAt,
      notes: dinners.notes,
      recipeId: recipes.id,
      recipeName: recipes.name,
      recipeImage: recipes.imageUrl,
    })
    .from(dinners)
    .leftJoin(dinnerRecipes, eq(dinnerRecipes.dinnerId, dinners.id))
    .leftJoin(recipes, eq(recipes.id, dinnerRecipes.recipeId))
    .where(before ? lt(dinners.eatenAt, before) : undefined)
    .orderBy(desc(dinners.eatenAt))

  return groupByDinner(rows).slice(0, limit)
}
