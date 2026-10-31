const SHORT_HEX = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
const LONG_HEX = /^#([0-9a-f]{6})$/i

/** Accepts `#abc` and `#aabbcc`. Null if neither. */
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

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  if (la === null || lb === null) return null
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export const BLACK = '#000000'
export const WHITE = '#ffffff'

/**
 * Whichever of black or white contrasts more. Computed rather than stored so
 * a label colour cannot end up unreadable. Falls back to black on bad input.
 */
export function textColorFor(background: string): typeof BLACK | typeof WHITE {
  const onBlack = contrastRatio(background, BLACK)
  const onWhite = contrastRatio(background, WHITE)
  if (onBlack === null || onWhite === null) return BLACK
  return onBlack >= onWhite ? BLACK : WHITE
}

/** True when the computed pairing clears 4.5:1. */
export function meetsAA(background: string): boolean {
  const ratio = contrastRatio(background, textColorFor(background))
  return ratio !== null && ratio >= 4.5
}
