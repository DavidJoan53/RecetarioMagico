'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createIngredient} from '@/db/ingredients/create-ingredient'
import {getSession} from '@/lib/session'
import {ingredientInputFromForm} from '@/lib/validation/ingredient'

export type FormState = {error?: 'invalid' | 'duplicateName'; done?: boolean}

/** Stays on the page: ingredients are added several at a time. */
export async function createIngredientAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/')

  const parsed = ingredientInputFromForm(form)
  if (!parsed.success) return {error: 'invalid'}

  const result = await createIngredient(parsed.data)
  if (!result.ok) return {error: 'duplicateName'}

  revalidatePath('/ingredients')
  return {done: true}
}
