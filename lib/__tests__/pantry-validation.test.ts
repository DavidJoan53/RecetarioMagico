import {describe, expect, it} from 'vitest'
import {pantryEntryFromForm, pantryEntryInput} from '../validation/pantry'

const form = (entries: Record<string, string>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(entries)) data.append(k, v)
  return data
}

describe('pantryEntryInput', () => {
  it('takes a quantity and a unit', () => {
    expect(pantryEntryInput.parse({quantity: 500, unit: 'g'})).toEqual({
      quantity: 500,
      unit: 'g',
    })
  })

  /** "Sal, al gusto" is a thing you have without a number. */
  it('allows having something without saying how much', () => {
    expect(
      pantryEntryInput.parse({quantity: null, unit: null}).quantity,
    ).toBeNull()
  })

  it('refuses a unit the column cannot store', () => {
    expect(pantryEntryInput.safeParse({quantity: 1, unit: 'kg'}).success).toBe(
      false,
    )
  })

  /** Zero is not "none" — leaving the field empty is. */
  it.each([0, -1])('refuses %s as a quantity', quantity => {
    expect(pantryEntryInput.safeParse({quantity, unit: 'g'}).success).toBe(
      false,
    )
  })
})

describe('pantryEntryFromForm', () => {
  it('reads blanks as absent rather than invalid', () => {
    const parsed = pantryEntryFromForm(form({quantity: '  ', unit: ''}))
    expect(parsed.success).toBe(true)
    expect(parsed.data).toEqual({quantity: null, unit: null})
  })

  it('reads a filled form', () => {
    const parsed = pantryEntryFromForm(form({quantity: '2.5', unit: 'taza'}))
    expect(parsed.data).toEqual({quantity: 2.5, unit: 'taza'})
  })

  it('refuses text where a number goes', () => {
    expect(
      pantryEntryFromForm(form({quantity: 'dos', unit: 'g'})).success,
    ).toBe(false)
  })

  it('reads an empty form as having neither', () => {
    expect(pantryEntryFromForm(new FormData()).data).toEqual({
      quantity: null,
      unit: null,
    })
  })
})
