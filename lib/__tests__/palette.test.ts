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

/**
 * Both surfaces, because text lands on both: the page, and the cards and rows
 * drawn on top of it. Checking only the page is how #cc323e passed here and
 * still failed on a row — the darker surface is the one that binds.
 */
const SURFACES = ['background', 'background-foreground'] as const

describe.each(SURFACES)('palette on --color-%s', surface => {
  const ground = token(surface)

  /**
   * The failure this guards against: #db3642 was picked for 4.53:1 against
   * white, but nothing in the app is white.
   */
  it.each(['secondary', 'secondary-foreground'])('reads %s as body text', t => {
    expect(contrastRatio(token(t), ground)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('keeps primary-strong legible as text', () => {
    expect(
      contrastRatio(token('primary-strong'), ground),
    ).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

/**
 * The brand red carries over from the React Native app and is not ours to
 * darken. It clears the 3:1 accent bar on the page and misses it on a card,
 * so the rule is about where it goes: page only, and never under text.
 */
describe('primary', () => {
  it('works as an accent on the page', () => {
    expect(
      contrastRatio(token('primary'), token('background')),
    ).toBeGreaterThanOrEqual(AA_LARGE)
  })

  it('does not reach the bar on a card, so it does not belong there', () => {
    expect(
      contrastRatio(token('primary'), token('background-foreground')),
    ).toBeLessThan(AA_LARGE)
  })
})

/** The other direction: primary-strong is a button fill as often as a link. */
it('keeps white text legible on primary-strong', () => {
  expect(
    contrastRatio(token('primary-strong'), '#ffffff'),
  ).toBeGreaterThanOrEqual(AA_TEXT)
})
