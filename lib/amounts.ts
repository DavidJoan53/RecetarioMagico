import type {Unit} from '@/db/schema'

export type Amount = {quantity: number; unit: Unit}

/**
 * Units are data, not translation keys — the enum already holds the Spanish
 * words a cook writes. Only the number is localised, so 1.5 reads as "1,5"
 * in Spanish and "1.5" in English.
 */
export function formatAmount({quantity, unit}: Amount, locale: string): string {
  return `${new Intl.NumberFormat(locale).format(quantity)} ${unit}`
}

/** As many names as fit a card on a narrow screen without wrapping. */
export const CARD_INGREDIENTS = 5

export type CardIngredients = {
  /** In order, capped. */
  shown: string[]
  /** How many did not fit. Zero when they all did. */
  more: number
}

/**
 * What a card says a recipe is made of: the first few names, and a count of
 * the rest.
 *
 * Names without amounts. A card is for recognising a recipe, not cooking from
 * it, and "Tomate 200 g · Cebolla 1 unidad" spends most of a narrow line on
 * numbers that only matter once you are already in the kitchen.
 */
export function cardIngredients(
  ingredients: readonly {name: string}[],
  limit: number = CARD_INGREDIENTS,
): CardIngredients {
  return {
    shown: ingredients.slice(0, limit).map(item => item.name),
    more: Math.max(0, ingredients.length - limit),
  }
}
