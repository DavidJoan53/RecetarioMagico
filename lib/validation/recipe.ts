import {z} from 'zod'
import {unitEnum} from '@/db/schema'

/** A week. Past this the field is a typo, not a slow braise. */
const MAX_PREP_MINUTES = 60 * 24 * 7

const trimmedLine = z.string().trim().min(1).max(500)

/**
 * Both halves required, together: "200" says nothing without a unit and "g"
 * says nothing without a number, so neither is worth storing alone.
 */
export const recipeIngredientInput = z.object({
  ingredientId: z.uuid(),
  quantity: z.number('required').positive().max(100_000),
  unit: z.enum(unitEnum.enumValues, 'required'),
})

export type RecipeIngredientInput = z.infer<typeof recipeIngredientInput>

/**
 * Told apart from a plain validation failure, because the two need different
 * words: one says a field is wrong, the other says which ingredient is
 * already in the list.
 */
export const DUPLICATE_INGREDIENT = 'duplicateIngredient'

export const recipeInput = z.object({
  name: z.string().trim().min(1, 'required').max(200),
  prepTimeMinutes: z.number().int().positive().max(MAX_PREP_MINUTES).nullable(),
  /** Blank rows are dropped rather than rejected — the form adds them. */
  instructions: z
    .array(z.string())
    .transform(dropBlank)
    .pipe(z.array(trimmedLine)),
  links: z.array(z.string()).transform(dropBlank).pipe(z.array(z.url())),
  /**
   * Checked here as well as by the unique index. The index is what makes it
   * true; this is what lets the form say so without a failed write.
   */
  ingredients: z
    .array(recipeIngredientInput)
    .refine(noRepeats, DUPLICATE_INGREDIENT),
  /**
   * A set, so the same label twice is one row rather than a primary key
   * collision. Nothing in the form can tick a box twice; a hand-built post
   * can.
   */
  labelIds: z.array(z.uuid()).transform(unique),
})

function dropBlank(values: string[]): string[] {
  return values.map(v => v.trim()).filter(Boolean)
}

function noRepeats(rows: {ingredientId: string}[]): boolean {
  return new Set(rows.map(r => r.ingredientId)).size === rows.length
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export type RecipeInput = z.infer<typeof recipeInput>

/**
 * A route param is untrusted like any other input. Without this a hand-typed
 * `/recipes/nope` reaches Postgres as a uuid comparison and raises, which is
 * a 500 for what is plainly a 404.
 */
export const recipeIdFrom = (value: string) => z.uuid().safeParse(value)

/** Which of the two messages the form should show. */
export function recipeErrorFrom(
  error: z.ZodError,
): typeof DUPLICATE_INGREDIENT | 'invalid' {
  return error.issues.some(issue => issue.message === DUPLICATE_INGREDIENT)
    ? DUPLICATE_INGREDIENT
    : 'invalid'
}

/**
 * Three parallel fields, one row each. Every row submits all three — a row
 * that left one of them out would shift every later row's quantity onto the
 * wrong ingredient — so an untouched row is the one with nothing in any of
 * them, and only that one is dropped.
 */
function ingredientRows(form: FormData) {
  const ids = form.getAll('ingredientId').map(String)
  const quantities = form.getAll('ingredientQuantity').map(String)
  const units = form.getAll('ingredientUnit').map(String)

  return ids
    .map((ingredientId, index) => ({
      ingredientId: ingredientId.trim(),
      quantity: (quantities[index] ?? '').trim(),
      unit: (units[index] ?? '').trim(),
    }))
    .filter(row => row.ingredientId || row.quantity || row.unit)
    .map(row => ({
      ingredientId: row.ingredientId,
      /* NaN rather than 0: an empty box is unanswered, not "none of it". */
      quantity: row.quantity === '' ? Number.NaN : Number(row.quantity),
      unit: row.unit,
    }))
}

/** Reads a browser FormData into the shape the schema expects. */
export function recipeInputFromForm(form: FormData) {
  const prep = String(form.get('prepTimeMinutes') ?? '').trim()
  return recipeInput.safeParse({
    name: form.get('name') ?? '',
    prepTimeMinutes: prep === '' ? null : Number(prep),
    instructions: form.getAll('instructions').map(String),
    links: form.getAll('links').map(String),
    ingredients: ingredientRows(form),
    /* Checkboxes: only the ticked ones are submitted, so an untouched form
       sends none and the recipe ends up with none. */
    labelIds: form.getAll('labelId').map(String),
  })
}
