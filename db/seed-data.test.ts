import {describe, expect, it} from 'vitest'
import {contrastRatio, meetsAA, parseHex, textColorFor} from '@/lib/color'
import {DEFAULT_LABEL_GROUPS} from './seed-data'

const labels = DEFAULT_LABEL_GROUPS.flatMap(g =>
  g.labels.map(l => ({...l, group: g.name})),
)

describe('default label groups', () => {
  it('seeds the groups the UI scheme shows', () => {
    expect(DEFAULT_LABEL_GROUPS.map(g => g.name)).toEqual([
      'Momento',
      'Herramienta',
      'Favoritos',
    ])
  })

  it('has no duplicate label names — they are user-facing', () => {
    const names = labels.map(l => l.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it.each(labels)('$group / $name has a parseable colour', ({color}) => {
    expect(parseHex(color)).not.toBeNull()
  })

  // The guard that matters: a seeded chip must be readable out of the box,
  // or the app ships with an axe violation on first run.
  it.each(labels)('$group / $name chip clears AA', ({color}) => {
    expect(meetsAA(color)).toBe(true)
    expect(contrastRatio(color, textColorFor(color))).toBeGreaterThanOrEqual(
      4.5,
    )
  })
})
