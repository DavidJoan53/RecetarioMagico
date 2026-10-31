export type DinnerWithRecipes = {
  id: string
  eatenAt: Date
  notes: string | null
  recipes: {id: string; name: string; imageUrl: string | null}[]
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
