import {describe, expect, it} from 'vitest'
import {
  contrastRatio,
  meetsAA,
  parseHex,
  relativeLuminance,
  textColorFor,
} from '../color'

describe('parseHex', () => {
  it('reads both hex lengths', () => {
    expect(parseHex('#ff3f4d')).toEqual([255, 63, 77])
    expect(parseHex('#f00')).toEqual([255, 0, 0])
  })
  it('is case insensitive and tolerates whitespace', () => {
    expect(parseHex('  #FF3F4D ')).toEqual([255, 63, 77])
  })
  it('rejects anything else', () => {
    for (const bad of ['ff3f4d', '#ff3f4', '#gggggg', 'red', '', '#']) {
      expect(parseHex(bad), bad).toBeNull()
    }
  })
})

describe('contrastRatio', () => {
  it('matches the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#808080', '#808080')).toBeCloseTo(1, 5)
  })
  it('is symmetric', () => {
    expect(contrastRatio('#ff3f4d', '#ffffff')).toBe(
      contrastRatio('#ffffff', '#ff3f4d'),
    )
  })
  it('reproduces the brand-red finding that set the palette rule', () => {
    expect(contrastRatio('#ff3f4d', '#ffffff')).toBeCloseTo(3.46, 1)
    expect(contrastRatio('#db3642', '#ffffff')).toBeCloseTo(4.53, 1)
  })
})

describe('textColorFor', () => {
  it('picks the readable option on each ground', () => {
    expect(textColorFor('#1c0708')).toBe('#ffffff')
    expect(textColorFor('#f1f1f1')).toBe('#000000')
  })

  /** The guarantee: a free picker cannot produce an unreadable chip. */
  it.each([
    '#ff3f4d',
    '#db3642',
    '#1c0708',
    '#ffff00',
    '#00ff00',
    '#0000ff',
    '#808080',
    '#7f7f7f',
    '#f1f1f1',
    '#7a5c3e',
    '#00e5ff',
    '#ffffff',
    '#000000',
  ])('keeps %s above the 4.5:1 bar', color => {
    expect(meetsAA(color)).toBe(true)
    expect(contrastRatio(color, textColorFor(color))).toBeGreaterThanOrEqual(
      4.5,
    )
  })

  it('never throws on a bad stored value — a wrong chip beats a dead page', () => {
    expect(textColorFor('not-a-colour')).toBe('#000000')
    expect(relativeLuminance('nope')).toBeNull()
  })
})
