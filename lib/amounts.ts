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

/** One line for a card: enough to recognise a recipe, not to cook from it. */
export function formatIngredientLine(
  ingredients: readonly (Amount & {name: string})[],
  locale: string,
): string {
  return ingredients
    .map(item => `${item.name} ${formatAmount(item, locale)}`)
    .join(' · ')
}
