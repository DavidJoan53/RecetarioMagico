'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createLabelGroup} from '@/db/label-groups/create-label-group'
import {createLabel} from '@/db/labels/create-label'
import {getSession} from '@/lib/session'
import {
  labelGroupInputFromForm,
  labelInputFromForm,
} from '@/lib/validation/label'

export type FormState = {
  error?: 'invalid' | 'duplicateName' | 'noGroup'
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
