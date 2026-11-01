import {z} from 'zod'
import {unitEnum} from '@/db/schema'

/** Both nullable: "sal, al gusto" is a pantry entry with no number. */
export const pantryEntryInput = z.object({
  quantity: z.number().positive().max(100_000).nullable(),
  unit: z.enum(unitEnum.enumValues).nullable(),
})

export type PantryEntryInput = z.infer<typeof pantryEntryInput>

export function pantryEntryFromForm(form: FormData) {
  const quantity = String(form.get('quantity') ?? '').trim()
  const unit = String(form.get('unit') ?? '').trim()
  return pantryEntryInput.safeParse({
    quantity: quantity === '' ? null : Number(quantity),
    unit: unit === '' ? null : unit,
  })
}
