'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createIngredient} from '@/db/ingredients/create-ingredient'
import {updateIngredient} from '@/db/ingredients/update-ingredient'
import {getSession} from '@/lib/session'
import {ingredientInputFromForm} from '@/lib/validation/ingredient'

export type FormState = {
  error?: 'invalid' | 'duplicateName' | 'gone'
  done?: boolean
}

/** Every action re-checks: each one is an endpoint of its own. */
async function requireSession() {
  if (!(await getSession())) redirect('/')
}

/** Stays on the page: ingredients are added several at a time. */
export async function createIngredientAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const parsed = ingredientInputFromForm(form)
  if (!parsed.success) return {error: 'invalid'}

  const result = await createIngredient(parsed.data)
  if (!result.ok) return {error: 'duplicateName'}

  revalidatePath('/ingredients')
  return {done: true}
}

export async function updateIngredientAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  const parsed = ingredientInputFromForm(form)
  if (!id || !parsed.success) return {error: 'invalid'}

  const result = await updateIngredient(id, parsed.data)
  if (!result.ok) {
    return {error: result.reason === 'not-found' ? 'gone' : 'duplicateName'}
  }

  revalidatePath('/ingredients')
  return {done: true}
}
