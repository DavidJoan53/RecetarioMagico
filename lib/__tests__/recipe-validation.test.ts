import {describe, expect, it} from 'vitest'
import {
  DUPLICATE_INGREDIENT,
  recipeErrorFrom,
  recipeIngredientInput,
  recipeInput,
  recipeInputFromForm,
} from '../validation/recipe'

const TOMATO = '0193f3a0-0000-7000-8000-000000000001'
const ONION = '0193f3a0-0000-7000-8000-000000000002'

const valid = {
  name: 'Arepa de huevo',
  prepTimeMinutes: 25,
  instructions: ['Amasar', 'Freír'],
  links: ['https://youtu.be/dQw4w9WgXcQ'],
  ingredients: [{ingredientId: TOMATO, quantity: 200, unit: 'g'}],
}

describe('recipeInput', () => {
  it('accepts a complete recipe', () => {
    expect(recipeInput.safeParse(valid).success).toBe(true)
  })

  it('trims the name and refuses one that is only whitespace', () => {
    expect(recipeInput.parse({...valid, name: '  Arepa  '}).name).toBe('Arepa')
    expect(recipeInput.safeParse({...valid, name: '   '}).success).toBe(false)
  })

  it('allows no prep time but not a nonsense one', () => {
    expect(
      recipeInput.safeParse({...valid, prepTimeMinutes: null}).success,
    ).toBe(true)
    for (const bad of [0, -5, 1.5, 60 * 24 * 8]) {
      expect(
        recipeInput.safeParse({...valid, prepTimeMinutes: bad}).success,
        String(bad),
      ).toBe(false)
    }
  })

  /** The form adds empty rows as you type; they are not errors. */
  it('drops blank instructions and links rather than failing', () => {
    const parsed = recipeInput.parse({
      ...valid,
      instructions: ['Amasar', '   ', '', 'Freír'],
      links: ['https://youtu.be/dQw4w9WgXcQ', '  '],
    })
    expect(parsed.instructions).toEqual(['Amasar', 'Freír'])
    expect(parsed.links).toHaveLength(1)
  })

  it('refuses a link that is not a URL', () => {
    expect(
      recipeInput.safeParse({...valid, links: ['not a url']}).success,
    ).toBe(false)
  })

  it('accepts a recipe with no steps and no links', () => {
    const parsed = recipeInput.parse({...valid, instructions: [], links: []})
    expect(parsed.instructions).toEqual([])
    expect(parsed.links).toEqual([])
  })

  /** A recipe can be written down before its amounts are worked out. */
  it('accepts a recipe with no ingredients yet', () => {
    expect(recipeInput.parse({...valid, ingredients: []}).ingredients).toEqual(
      [],
    )
  })

  it('refuses the same ingredient twice', () => {
    const result = recipeInput.safeParse({
      ...valid,
      ingredients: [
        {ingredientId: TOMATO, quantity: 200, unit: 'g'},
        {ingredientId: TOMATO, quantity: 1, unit: 'unidad'},
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts two different ingredients', () => {
    const result = recipeInput.safeParse({
      ...valid,
      ingredients: [
        {ingredientId: TOMATO, quantity: 200, unit: 'g'},
        {ingredientId: ONION, quantity: 1, unit: 'unidad'},
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('recipeIngredientInput', () => {
  const row = {ingredientId: TOMATO, quantity: 200, unit: 'g'}

  it('accepts a quantity with its unit', () => {
    expect(recipeIngredientInput.safeParse(row).success).toBe(true)
  })

  /** Both halves, always: neither says anything on its own. */
  it('refuses a missing quantity and a missing unit alike', () => {
    expect(
      recipeIngredientInput.safeParse({...row, quantity: Number.NaN}).success,
    ).toBe(false)
    expect(recipeIngredientInput.safeParse({...row, unit: ''}).success).toBe(
      false,
    )
  })

  it('refuses a quantity that is not a positive number', () => {
    for (const bad of [0, -1, 100_001]) {
      expect(
        recipeIngredientInput.safeParse({...row, quantity: bad}).success,
        String(bad),
      ).toBe(false)
    }
  })

  it('refuses a unit outside the enum', () => {
    expect(recipeIngredientInput.safeParse({...row, unit: 'kg'}).success).toBe(
      false,
    )
  })

  it('refuses an ingredient id that is not a uuid', () => {
    expect(
      recipeIngredientInput.safeParse({...row, ingredientId: 'tomate'}).success,
    ).toBe(false)
  })
})

describe('recipeErrorFrom', () => {
  const errorFor = (ingredients: unknown) => {
    const result = recipeInput.safeParse({...valid, ingredients})
    if (result.success) throw new Error('expected a failure to inspect')
    return recipeErrorFrom(result.error)
  }

  /** The two need different words, so they cannot collapse into one. */
  it('tells a repeated ingredient apart from a bad field', () => {
    expect(
      errorFor([
        {ingredientId: TOMATO, quantity: 200, unit: 'g'},
        {ingredientId: TOMATO, quantity: 1, unit: 'unidad'},
      ]),
    ).toBe(DUPLICATE_INGREDIENT)
    expect(errorFor([{ingredientId: TOMATO, quantity: 0, unit: 'g'}])).toBe(
      'invalid',
    )
  })
})

describe('recipeInputFromForm', () => {
  const form = (entries: [string, string][]) => {
    const f = new FormData()
    for (const [k, v] of entries) f.append(k, v)
    return f
  }

  it('reads repeated fields into arrays', () => {
    const result = recipeInputFromForm(
      form([
        ['name', 'Arepa'],
        ['prepTimeMinutes', '25'],
        ['instructions', 'Amasar'],
        ['instructions', 'Freír'],
        ['links', 'https://youtu.be/dQw4w9WgXcQ'],
      ]),
    )
    expect(result.success).toBe(true)
    expect(result.data?.instructions).toEqual(['Amasar', 'Freír'])
  })

  /** An untouched number input submits "", which is not zero. */
  it('treats an empty prep time as no value, not as 0', () => {
    const result = recipeInputFromForm(
      form([
        ['name', 'Arepa'],
        ['prepTimeMinutes', ''],
      ]),
    )
    expect(result.success).toBe(true)
    expect(result.data?.prepTimeMinutes).toBeNull()
  })

  it('fails when the name is missing', () => {
    expect(recipeInputFromForm(form([['name', '']])).success).toBe(false)
  })

  it('pairs each ingredient with the amount submitted beside it', () => {
    const result = recipeInputFromForm(
      form([
        ['name', 'Arepa'],
        ['ingredientId', TOMATO],
        ['ingredientQuantity', '200'],
        ['ingredientUnit', 'g'],
        ['ingredientId', ONION],
        ['ingredientQuantity', '1'],
        ['ingredientUnit', 'unidad'],
      ]),
    )
    expect(result.data?.ingredients).toEqual([
      {ingredientId: TOMATO, quantity: 200, unit: 'g'},
      {ingredientId: ONION, quantity: 1, unit: 'unidad'},
    ])
  })

  /** The row the "add" button just made, before anything was typed into it. */
  it('drops a row with nothing in any of its three fields', () => {
    const result = recipeInputFromForm(
      form([
        ['name', 'Arepa'],
        ['ingredientId', TOMATO],
        ['ingredientQuantity', '200'],
        ['ingredientUnit', 'g'],
        ['ingredientId', ''],
        ['ingredientQuantity', ''],
        ['ingredientUnit', ''],
      ]),
    )
    expect(result.data?.ingredients).toHaveLength(1)
  })

  /**
   * Half a row is a mistake, not an empty one. Dropping it would throw away
   * the amount without saying anything.
   */
  it('refuses a row that names an ingredient with no amount', () => {
    const result = recipeInputFromForm(
      form([
        ['name', 'Arepa'],
        ['ingredientId', TOMATO],
        ['ingredientQuantity', ''],
        ['ingredientUnit', 'g'],
      ]),
    )
    expect(result.success).toBe(false)
  })

  it('refuses an amount with no ingredient to put it against', () => {
    const result = recipeInputFromForm(
      form([
        ['name', 'Arepa'],
        ['ingredientId', ''],
        ['ingredientQuantity', '200'],
        ['ingredientUnit', 'g'],
      ]),
    )
    expect(result.success).toBe(false)
  })
})
