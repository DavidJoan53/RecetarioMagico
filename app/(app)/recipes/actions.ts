'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createRecipe} from '@/db/recipes/create-recipe'
import {updateRecipe} from '@/db/recipes/update-recipe'
import {getSession} from '@/lib/session'
import {recipeErrorFrom, recipeInputFromForm} from '@/lib/validation/recipe'

export type FormState = {
  error?:
    | 'invalid'
    | 'duplicateName'
    | 'duplicateIngredient'
    | 'ingredientGone'
    | 'gone'
  done?: boolean
}

/** Every action re-checks: each one is an endpoint of its own. */
async function requireSession() {
  if (!(await getSession())) redirect('/')
}

/** Home shows the newest recipes, so a write there is stale too. */
function revalidateRecipes(id?: string) {
  revalidatePath('/recipes')
  revalidatePath('/home')
  if (id) revalidatePath(`/recipes/${id}`)
}

export async function createRecipeAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const parsed = recipeInputFromForm(form)
  if (!parsed.success) return {error: recipeErrorFrom(parsed.error)}

  const result = await createRecipe(parsed.data)
  if (!result.ok) {
    return {
      error:
        result.reason === 'duplicate-name' ? 'duplicateName' : 'ingredientGone',
    }
  }

  revalidateRecipes()
  /* Returned rather than redirected. redirect throws to unwind, so the
     action never returns and the form has nothing to raise a toast from --
     the confirmation would be lost on the way to the list. Where to go is
     the form's to decide now. */
  return {done: true}
}

export async function updateRecipeAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  const parsed = recipeInputFromForm(form)
  if (!id) return {error: 'gone'}
  if (!parsed.success) return {error: recipeErrorFrom(parsed.error)}

  const result = await updateRecipe(id, parsed.data)
  if (!result.ok) {
    if (result.reason === 'not-found') return {error: 'gone'}
    return {
      error:
        result.reason === 'duplicate-name' ? 'duplicateName' : 'ingredientGone',
    }
  }

  revalidateRecipes(id)
  return {done: true}
}
