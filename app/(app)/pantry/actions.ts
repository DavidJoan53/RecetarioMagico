'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
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
