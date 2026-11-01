'use server'

import {redirect} from 'next/navigation'
import {createRecipe} from '@/db/mutations/create-recipe'
import {getSession} from '@/lib/session'
import {recipeInputFromForm} from '@/lib/validation/recipe'

export type FormState = {error?: 'invalid' | 'duplicateName'}

/** Re-checks the session: a server action is an endpoint like any other. */
export async function createRecipeAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/')

  const parsed = recipeInputFromForm(form)
  if (!parsed.success) return {error: 'invalid'}

  const result = await createRecipe(parsed.data)
  if (!result.ok) return {error: 'duplicateName'}

  redirect(`/recipes/${result.id}`)
}
