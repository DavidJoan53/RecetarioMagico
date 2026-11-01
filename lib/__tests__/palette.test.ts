import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {contrastRatio} from '../color'

/** Read from the stylesheet, so a change there is what the test sees. */
const css = readFileSync('app/globals.css', 'utf8')

function token(name: string): string {
  const found = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i'))
  if (!found?.[1]) throw new Error(`--color-${name} not found`)
  return found[1]
}

const AA_TEXT = 4.5
const AA_LARGE = 3

describe('palette', () => {
  const background = token('background')

  /**
   * The failure this guards against: #db3642 was picked for 4.53:1 against
   * white, but the page is #f1f1f1, where it only reached 4.02:1.
   */
  it('reads body text against the background it actually sits on', () => {
    expect(
      contrastRatio(token('secondary'), background),
    ).toBeGreaterThanOrEqual(AA_TEXT)
    expect(
      contrastRatio(token('secondary-foreground'), background),
    ).toBeGreaterThanOrEqual(AA_TEXT)
  })

  /** It is a link colour as often as a button fill, so both directions count. */
  it('keeps primary-strong legible as text and as a fill', () => {
    expect(
      contrastRatio(token('primary-strong'), background),
    ).toBeGreaterThanOrEqual(AA_TEXT)
    expect(
      contrastRatio(token('primary-strong'), '#ffffff'),
    ).toBeGreaterThanOrEqual(AA_TEXT)
  })

  /** Accents carry no text, so 3:1 is the bar — but it is still a bar. */
  it('keeps primary usable as an accent', () => {
    expect(contrastRatio(token('primary'), background)).toBeGreaterThanOrEqual(
      AA_LARGE,
    )
  })
})
