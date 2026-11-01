import {z} from 'zod'
import {unitEnum} from '@/db/schema'

/**
 * Both required, together. "500" says nothing without a unit and "g" says
 * nothing without a number, so neither is useful alone.
 *
 * The columns stay nullable: rows written before this rule still exist, and
 * the pantry has to show them.
 */
export const pantryEntryInput = z.object({
  quantity: z.number('required').positive().max(100_000),
  unit: z.enum(unitEnum.enumValues, 'required'),
})

export type PantryEntryInput = z.infer<typeof pantryEntryInput>

export function pantryEntryFromForm(form: FormData) {
  const quantity = String(form.get('quantity') ?? '').trim()
  return pantryEntryInput.safeParse({
    quantity: quantity === '' ? Number.NaN : Number(quantity),
    unit: String(form.get('unit') ?? '').trim(),
  })
}
