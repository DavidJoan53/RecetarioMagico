import {describe, expect, it} from 'vitest'
import {CARD_INGREDIENTS, cardIngredients, formatAmount} from '../amounts'

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

describe('cardIngredients', () => {
  const named = (count: number) =>
    Array.from({length: count}, (_, i) => ({name: `Ingrediente ${i + 1}`}))

  it('gives the names in order', () => {
    expect(cardIngredients([{name: 'Tomate'}, {name: 'Cebolla'}])).toEqual({
      shown: ['Tomate', 'Cebolla'],
      more: 0,
    })
  })

  /** Amounts are for the recipe, not for recognising it in a list. */
  it('keeps only the name, whatever else the row carries', () => {
    /* A variable, not a literal: an excess-property check would reject the
       amount inline, where a real recipe row carries it. */
    const row = {name: 'Tomate', quantity: 200, unit: 'g'} as const
    expect(cardIngredients([row]).shown).toEqual(['Tomate'])
  })

  it('counts the ones that did not fit rather than dropping them silently', () => {
    const {shown, more} = cardIngredients(named(8))
    expect(shown).toHaveLength(CARD_INGREDIENTS)
    expect(more).toBe(3)
  })

  /** Exactly the limit is not "and 0 more". */
  it('reports nothing left over when they all fit', () => {
    expect(cardIngredients(named(CARD_INGREDIENTS)).more).toBe(0)
  })

  it('has nothing to show for a recipe that lists nothing yet', () => {
    expect(cardIngredients([])).toEqual({shown: [], more: 0})
  })

  it('takes a limit of its own', () => {
    const {shown, more} = cardIngredients(named(4), 2)
    expect(shown).toHaveLength(2)
    expect(more).toBe(2)
  })
})
