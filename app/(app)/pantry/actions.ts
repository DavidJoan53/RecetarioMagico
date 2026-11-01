'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {addToPantry} from '@/db/pantry/add-to-pantry'
import {removeFromPantry} from '@/db/pantry/remove-from-pantry'
import {updatePantryEntry} from '@/db/pantry/update-pantry-entry'
import {getSession} from '@/lib/session'
import {pantryEntryFromForm} from '@/lib/validation/pantry'

export type FormState = {error?: 'invalid' | 'gone'; done?: boolean}

async function requireSession() {
  if (!(await getSession())) redirect('/')
}

export async function updatePantryEntryAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  const parsed = pantryEntryFromForm(form)
  if (!id || !parsed.success) return {error: 'invalid'}

  const result = await updatePantryEntry(id, parsed.data)
  if (!result.ok) return {error: 'gone'}

  revalidatePath('/pantry')
  return {done: true}
}

/** Removing is not deleting: the ingredient stays, only the having goes. */
export async function removeFromPantryAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  if (!id) return {error: 'gone'}

  await removeFromPantry(id)
  revalidatePath('/pantry')
  revalidatePath('/ingredients')
  return {done: true}
}

export type AddState = {
  error?: 'invalid' | 'alreadyThere'
  /** Named back, so the page can say what it added without holding state. */
  added?: string
}

/**
 * One at a time, with its amount. The unique index decides whether it is
 * already there rather than a read beforehand, which two tabs would both
 * pass.
 */
export async function addToPantryAction(
  _previous: AddState,
  form: FormData,
): Promise<AddState> {
  await requireSession()

  const id = String(form.get('ingredientId') ?? '')
  const name = String(form.get('ingredientName') ?? '')
  const parsed = pantryEntryFromForm(form)
  if (!id || !parsed.success) return {error: 'invalid'}

  const result = await addToPantry(id, parsed.data)
  if (!result.ok) return {error: 'alreadyThere'}

  revalidatePath('/pantry')
  return {added: name}
}
