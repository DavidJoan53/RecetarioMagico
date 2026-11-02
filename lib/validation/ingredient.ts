import {z} from 'zod'

export const ingredientInput = z.object({
  name: z.string().trim().min(1, 'required').max(120),
  /** A URL to someone else's image. The app stores no files. */
  photoUrl: z.url().nullable(),
})

export type IngredientInput = z.infer<typeof ingredientInput>

export function ingredientInputFromForm(form: FormData) {
  const photo = String(form.get('photoUrl') ?? '').trim()
  return ingredientInput.safeParse({
    name: form.get('name') ?? '',
    photoUrl: photo === '' ? null : photo,
  })
}
