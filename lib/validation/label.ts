import {z} from 'zod'

/** Six digits only. The picker emits this, and the parser in lib/color reads it. */
const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-f]{6}$/i, 'hex')
  .transform(value => value.toLowerCase())

const name = z.string().trim().min(1, 'required').max(80)

export const labelGroupInput = z.object({name})

export const labelInput = z.object({
  name,
  color: hexColor,
  labelGroupId: z.uuid(),
})

export type LabelGroupInput = z.infer<typeof labelGroupInput>
export type LabelInput = z.infer<typeof labelInput>

export function labelGroupInputFromForm(form: FormData) {
  return labelGroupInput.safeParse({name: form.get('name') ?? ''})
}

export function labelInputFromForm(form: FormData) {
  return labelInput.safeParse({
    name: form.get('name') ?? '',
    color: form.get('color') ?? '',
    labelGroupId: form.get('labelGroupId') ?? '',
  })
}
