import {describe, expect, it} from 'vitest'
import {recipeInput, recipeInputFromForm} from '../validation/recipe'

const valid = {
  name: 'Arepa de huevo',
  prepTimeMinutes: 25,
  instructions: ['Amasar', 'Freír'],
  links: ['https://youtu.be/dQw4w9WgXcQ'],
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
})
