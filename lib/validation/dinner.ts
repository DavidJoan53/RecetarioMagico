import {z} from 'zod'

/** Enough for "sobró la mitad", not enough to be a recipe in disguise. */
const NOTES_MAX = 500

/** A plate each for a table of six, with room to be wrong about it. */
const RECIPES_MAX = 20

export const dinnerInput = z.object({
  /**
   * An instant, offset and all. The browser converts the wall clock it was
   * given before sending it, so a bare "2026-11-01T20:00" is a sign that
   * conversion did not happen — and reading it here would silently call it
   * UTC. Rejecting it is what keeps the hour honest.
   */
  eatenAt: z.iso.datetime('required').transform(value => new Date(value)),
  notes: z.string().trim().max(NOTES_MAX).nullable(),
  /**
   * At least one. The point of a dinner is which recipe was cooked that day,
   * and a row holding none of them records nothing — the schema allows it,
   * so this is the only place the rule exists.
   */
  recipeIds: z
    .array(z.uuid())
    .min(1, 'required')
    .max(RECIPES_MAX)
    /** dinner_recipes is keyed on the pair, so a repeat is an error. */
    .transform(ids => [...new Set(ids)]),
})

export type DinnerInput = z.infer<typeof dinnerInput>

export function dinnerInputFromForm(form: FormData) {
  const notes = String(form.get('notes') ?? '').trim()
  return dinnerInput.safeParse({
    eatenAt: String(form.get('eatenAt') ?? ''),
    notes: notes === '' ? null : notes,
    recipeIds: form.getAll('recipeIds').map(String),
  })
}
