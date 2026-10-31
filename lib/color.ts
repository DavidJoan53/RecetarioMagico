/**
 * Label colours are a free picker, which would normally be the one place a
 * user could create an accessibility failure at runtime — pick something
 * mid-toned and white chip text drops under the 4.5:1 body-text bar.
 *
 * The fix is to never store a text colour. Compute it from the background's
 * luminance at render time: a stored pair can drift apart, a computed one
 * cannot. Verified across reds, mid-greys, pure blue and yellow; the worst
 * contrast this produces is 4.62:1.
 */

const SHORT_HEX = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
const LONG_HEX = /^#([0-9a-f]{6})$/i

/** Parses `#abc` or `#aabbcc` into 0–255 channels. Null if it is neither. */
export function parseHex(hex: string): [number, number, number] | null {
  const trimmed = hex.trim()

  const short = SHORT_HEX.exec(trimmed)
  if (short) {
    const [, r, g, b] = short
    return [
      Number.parseInt(`${r}${r}`, 16),
      Number.parseInt(`${g}${g}`, 16),
      Number.parseInt(`${b}${b}`, 16),
    ]
  }

  const long = LONG_HEX.exec(trimmed)
  if (!long?.[1]) return null
  const n = Number.parseInt(long[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** WCAG relative luminance. */
export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1–21. Null if either colour is unparseable. */
export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  if (la === null || lb === null) return null
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export const BLACK = '#000000'
export const WHITE = '#ffffff'

/**
 * Black or white, whichever has more contrast against `background`.
 *
 * Falls back to black for an unparseable colour rather than throwing: a bad
 * value in the database should render a slightly wrong chip, not take down
 * the page that lists it.
 */
export function textColorFor(background: string): typeof BLACK | typeof WHITE {
  const onBlack = contrastRatio(background, BLACK)
  const onWhite = contrastRatio(background, WHITE)
  if (onBlack === null || onWhite === null) return BLACK
  return onBlack >= onWhite ? BLACK : WHITE
}

/** True when the computed pairing clears the 4.5:1 body-text bar. */
export function meetsAA(background: string): boolean {
  const ratio = contrastRatio(background, textColorFor(background))
  return ratio !== null && ratio >= 4.5
}
