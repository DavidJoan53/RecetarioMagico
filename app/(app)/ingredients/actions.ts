'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createIngredient} from '@/db/ingredients/create-ingredient'
import {deleteIngredient} from '@/db/ingredients/delete-ingredient'
import {updateIngredient} from '@/db/ingredients/update-ingredient'
import {addToPantry} from '@/db/pantry/add-to-pantry'
import {removeFromPantry} from '@/db/pantry/remove-from-pantry'
import {getSession} from '@/lib/session'
import {ingredientInputFromForm} from '@/lib/validation/ingredient'

export type FormState = {
  error?: 'invalid' | 'duplicateName' | 'gone'
  done?: boolean
}

export type DeleteState = {
  error?: 'inUse' | 'gone'
  /** Named in the message, so "used by 3 recipes" is not a guess. */
  recipeCount?: number
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

export async function deleteIngredientAction(
  _previous: DeleteState,
  form: FormData,
): Promise<DeleteState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  if (!id) return {error: 'gone'}

  const result = await deleteIngredient(id)
  if (!result.ok) {
    if (result.reason === 'not-found') return {error: 'gone'}
    return {error: 'inUse', recipeCount: result.recipeCount}
  }

  revalidatePath('/ingredients')
  return {}
}

export type PantryState = {error?: 'gone'}

/**
 * The next state is sent rather than read, so two rapid clicks cannot both
 * decide to add. Idempotent either way.
 */
export async function togglePantryAction(
  _previous: PantryState,
  form: FormData,
): Promise<PantryState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  if (!id) return {error: 'gone'}

  if (form.get('inPantry') === 'true') await removeFromPantry(id)
  else await addToPantry(id)

  revalidatePath('/ingredients')
  revalidatePath('/pantry')
  return {}
}
