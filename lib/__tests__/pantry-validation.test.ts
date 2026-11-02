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

  /** "500" says nothing without a unit, and "g" nothing without a number. */
  it('refuses a quantity with no unit', () => {
    expect(
      pantryEntryInput.safeParse({quantity: 500, unit: null}).success,
    ).toBe(false)
  })

  it('refuses a unit with no quantity', () => {
    expect(
      pantryEntryInput.safeParse({quantity: null, unit: 'g'}).success,
    ).toBe(false)
  })

  it('refuses neither', () => {
    expect(
      pantryEntryInput.safeParse({quantity: null, unit: null}).success,
    ).toBe(false)
  })

  it('refuses a unit the column cannot store', () => {
    expect(pantryEntryInput.safeParse({quantity: 1, unit: 'kg'}).success).toBe(
      false,
    )
  })

  /** Zero is not an amount you have. */
  it.each([0, -1])('refuses %s as a quantity', quantity => {
    expect(pantryEntryInput.safeParse({quantity, unit: 'g'}).success).toBe(
      false,
    )
  })
})

describe('pantryEntryFromForm', () => {
  it('reads a filled form', () => {
    expect(
      pantryEntryFromForm(form({quantity: '2.5', unit: 'taza'})).data,
    ).toEqual({quantity: 2.5, unit: 'taza'})
  })

  /** An untouched number input submits as '', which is not a quantity. */
  it('refuses a blank quantity rather than reading it as none', () => {
    expect(pantryEntryFromForm(form({quantity: '  ', unit: 'g'})).success).toBe(
      false,
    )
  })

  it('refuses the empty option on the unit select', () => {
    expect(pantryEntryFromForm(form({quantity: '5', unit: ''})).success).toBe(
      false,
    )
  })

  it('refuses text where a number goes', () => {
    expect(
      pantryEntryFromForm(form({quantity: 'dos', unit: 'g'})).success,
    ).toBe(false)
  })

  it('refuses a form with nothing in it', () => {
    expect(pantryEntryFromForm(new FormData()).success).toBe(false)
  })
})
