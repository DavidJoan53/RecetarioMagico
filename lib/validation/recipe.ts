import {z} from 'zod'

/** A week. Past this the field is a typo, not a slow braise. */
const MAX_PREP_MINUTES = 60 * 24 * 7

const trimmedLine = z.string().trim().min(1).max(500)

export const recipeInput = z.object({
  name: z.string().trim().min(1, 'required').max(200),
  prepTimeMinutes: z.number().int().positive().max(MAX_PREP_MINUTES).nullable(),
  /** Blank rows are dropped rather than rejected — the form adds them. */
  instructions: z
    .array(z.string())
    .transform(dropBlank)
    .pipe(z.array(trimmedLine)),
  links: z.array(z.string()).transform(dropBlank).pipe(z.array(z.url())),
})

function dropBlank(values: string[]): string[] {
  return values.map(v => v.trim()).filter(Boolean)
}

export type RecipeInput = z.infer<typeof recipeInput>

/** Reads a browser FormData into the shape the schema expects. */
export function recipeInputFromForm(form: FormData) {
  const prep = String(form.get('prepTimeMinutes') ?? '').trim()
  return recipeInput.safeParse({
    name: form.get('name') ?? '',
    prepTimeMinutes: prep === '' ? null : Number(prep),
    instructions: form.getAll('instructions').map(String),
    links: form.getAll('links').map(String),
  })
}
