'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createLabelGroup} from '@/db/label-groups/create-label-group'
import {deleteLabelGroup} from '@/db/label-groups/delete-label-group'
import {updateLabelGroup} from '@/db/label-groups/update-label-group'
import {createLabel} from '@/db/labels/create-label'
import {deleteLabel} from '@/db/labels/delete-label'
import {updateLabel} from '@/db/labels/update-label'
import {getSession} from '@/lib/session'
import {
  labelGroupInputFromForm,
  labelInputFromForm,
} from '@/lib/validation/label'

export type FormState = {
  error?: 'invalid' | 'duplicateName' | 'noGroup' | 'gone'
  done?: boolean
}

/** Every action re-checks: each one is an endpoint of its own. */
async function requireSession() {
  if (!(await getSession())) redirect('/')
}

export async function createLabelGroupAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const parsed = labelGroupInputFromForm(form)
  if (!parsed.success) return {error: 'invalid'}

  const result = await createLabelGroup(parsed.data)
  if (!result.ok) return {error: 'duplicateName'}

  revalidatePath('/labels')
  return {done: true}
}

export async function updateLabelGroupAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  const parsed = labelGroupInputFromForm(form)
  if (!id || !parsed.success) return {error: 'invalid'}

  const result = await updateLabelGroup(id, parsed.data)
  if (!result.ok) {
    return {error: result.reason === 'not-found' ? 'gone' : 'duplicateName'}
  }

  revalidatePath('/labels')
  return {done: true}
}

export async function deleteLabelGroupAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  if (!id) return {error: 'gone'}

  const result = await deleteLabelGroup(id)
  if (!result.ok) return {error: 'gone'}

  revalidatePath('/labels')
  return {done: true}
}

export async function createLabelAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const parsed = labelInputFromForm(form)
  if (!parsed.success) return {error: 'invalid'}

  const result = await createLabel(parsed.data)
  if (!result.ok) {
    return {error: result.reason === 'no-group' ? 'noGroup' : 'duplicateName'}
  }

  revalidatePath('/labels')
  return {done: true}
}

export async function updateLabelAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  const parsed = labelInputFromForm(form)
  if (!id || !parsed.success) return {error: 'invalid'}

  const result = await updateLabel(id, parsed.data)
  if (!result.ok) {
    return {error: result.reason === 'not-found' ? 'gone' : 'duplicateName'}
  }

  revalidatePath('/labels')
  return {done: true}
}

export async function deleteLabelAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession()

  const id = String(form.get('id') ?? '')
  if (!id) return {error: 'gone'}

  const result = await deleteLabel(id)
  if (!result.ok) return {error: 'gone'}

  revalidatePath('/labels')
  return {done: true}
}
