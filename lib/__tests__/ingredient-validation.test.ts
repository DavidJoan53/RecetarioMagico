import {describe, expect, it} from 'vitest'
import {
  ingredientInput,
  ingredientInputFromForm,
} from '../validation/ingredient'

const form = (entries: [string, string][]) => {
  const data = new FormData()
  for (const [k, v] of entries) data.append(k, v)
  return data
}

describe('ingredientInput', () => {
  it('trims the name', () => {
    const parsed = ingredientInput.parse({name: '  Tomate ', photoUrl: null})
    expect(parsed.name).toBe('Tomate')
  })

  it('rejects a name that is only whitespace', () => {
    expect(
      ingredientInput.safeParse({name: '   ', photoUrl: null}).success,
    ).toBe(false)
  })

  it('rejects a photo that is not a URL', () => {
    expect(
      ingredientInput.safeParse({name: 'Tomate', photoUrl: 'tomate.png'})
        .success,
    ).toBe(false)
  })
})

describe('ingredientInputFromForm', () => {
  /** The field is optional, and an untouched input submits as ''. */
  it('reads a blank photo as absent rather than invalid', () => {
    const parsed = ingredientInputFromForm(
      form([
        ['name', 'Tomate'],
        ['photoUrl', '  '],
      ]),
    )
    expect(parsed.success).toBe(true)
    expect(parsed.data?.photoUrl).toBeNull()
  })

  it('keeps a photo that is given', () => {
    const parsed = ingredientInputFromForm(
      form([
        ['name', 'Tomate'],
        ['photoUrl', 'https://example.com/t.png'],
      ]),
    )
    expect(parsed.data?.photoUrl).toBe('https://example.com/t.png')
  })

  it('fails when the name is missing', () => {
    expect(ingredientInputFromForm(form([['photoUrl', '']])).success).toBe(
      false,
    )
  })
})
