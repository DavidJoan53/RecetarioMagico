import {describe, expect, it} from 'vitest'
import {formatAmount, formatIngredientLine} from '../amounts'

describe('formatAmount', () => {
  it('puts the number before the unit', () => {
    expect(formatAmount({quantity: 200, unit: 'g'}, 'es')).toBe('200 g')
  })

  /** numeric(10,2) comes back as a number, so a whole one has no ",00". */
  it('does not pad a whole number with decimals', () => {
    expect(formatAmount({quantity: 1, unit: 'unidad'}, 'es')).toBe('1 unidad')
  })

  it('writes the decimal separator the locale uses', () => {
    expect(formatAmount({quantity: 1.5, unit: 'taza'}, 'es')).toBe('1,5 taza')
    expect(formatAmount({quantity: 1.5, unit: 'taza'}, 'en')).toBe('1.5 taza')
  })
})

describe('formatIngredientLine', () => {
  const tomato = {name: 'Tomate', quantity: 200, unit: 'g'} as const
  const onion = {name: 'Cebolla', quantity: 1, unit: 'unidad'} as const

  it('names each ingredient with how much of it there is', () => {
    expect(formatIngredientLine([tomato, onion], 'es')).toBe(
      'Tomate 200 g · Cebolla 1 unidad',
    )
  })

  it('is empty when the recipe lists nothing yet', () => {
    expect(formatIngredientLine([], 'es')).toBe('')
  })
})
