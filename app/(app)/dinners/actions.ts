'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createDinner} from '@/db/dinners/create-dinner'
import {deleteDinner} from '@/db/dinners/delete-dinner'
import {updateDinner} from '@/db/dinners/update-dinner'
import {getSession} from '@/lib/session'
import {dinnerInputFromForm} from '@/lib/validation/dinner'

export type FormState = {
  error?: 'invalid' | 'recipeGone' | 'gone'
  done?: boolean
}

export type DeleteState = {
  error?: 'gone'
}

/** Every action re-checks: each one is an endpoint of its own. */
async function requireSession() {
  if (!(await getSession())) redirect('/')
}

/** Home shows the latest dinners, so a write there is stale too. */
function revalidateDinners() {
  revalidatePath('/dinners')
  revalidatePath('/home')
}

/** Stays on the page: a week is logged several at a time. */
export async function createDinnerAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const parsed = dinnerInputFromForm(form)
  if (!parsed.success) return {error: 'invalid'}

  const result = await createDinner(parsed.data)
  if (!result.ok) return {error: 'recipeGone'}

  revalidateDinners()
  return {done: true}
}

export async function updateDinnerAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  const parsed = dinnerInputFromForm(form)
  if (!id || !parsed.success) return {error: 'invalid'}

  const result = await updateDinner(id, parsed.data)
  if (!result.ok) {
    return {error: result.reason === 'not-found' ? 'gone' : 'recipeGone'}
  }

  revalidateDinners()
  return {done: true}
}

export async function deleteDinnerAction(
  _previous: DeleteState,
  form: FormData,
): Promise<DeleteState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  if (!id) return {error: 'gone'}

  const result = await deleteDinner(id)
  if (!result.ok) return {error: 'gone'}

  revalidateDinners()
  return {}
}
