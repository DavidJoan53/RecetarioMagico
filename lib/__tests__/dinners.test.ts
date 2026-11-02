import {describe, expect, it} from 'vitest'
import {
  attachRecipes,
  decodeDinnerCursor,
  encodeDinnerCursor,
  fromDateTimeLocal,
  groupByDinner,
  toDateTimeLocal,
} from '../dinners'

const at = new Date('2026-10-30T20:00:00Z')

describe('groupByDinner', () => {
  it('collapses one row per recipe into one entry per dinner', () => {
    const result = groupByDinner([
      {
        id: 'd1',
        eatenAt: at,
        notes: null,
        recipeId: 'r1',
        recipeName: 'Arepa',
        recipeImage: null,
      },
      {
        id: 'd1',
        eatenAt: at,
        notes: null,
        recipeId: 'r2',
        recipeName: 'Café',
        recipeImage: null,
      },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.recipes.map(r => r.name)).toEqual(['Arepa', 'Café'])
  })

  it('keeps separate dinners separate', () => {
    const result = groupByDinner([
      {
        id: 'd1',
        eatenAt: at,
        notes: null,
        recipeId: 'r1',
        recipeName: 'Arepa',
        recipeImage: null,
      },
      {
        id: 'd2',
        eatenAt: at,
        notes: 'rico',
        recipeId: 'r1',
        recipeName: 'Arepa',
        recipeImage: null,
      },
    ])
    expect(result.map(d => d.id)).toEqual(['d1', 'd2'])
    expect(result[1]?.notes).toBe('rico')
  })

  /** A LEFT JOIN returns the dinner with null recipe columns. */
  it('keeps a dinner that has no recipes', () => {
    const result = groupByDinner([
      {
        id: 'd1',
        eatenAt: at,
        notes: null,
        recipeId: null,
        recipeName: null,
        recipeImage: null,
      },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.recipes).toEqual([])
  })

  it('preserves the order the query returned', () => {
    const result = groupByDinner([
      {
        id: 'd2',
        eatenAt: at,
        notes: null,
        recipeId: null,
        recipeName: null,
        recipeImage: null,
      },
      {
        id: 'd1',
        eatenAt: at,
        notes: null,
        recipeId: null,
        recipeName: null,
        recipeImage: null,
      },
    ])
    expect(result.map(d => d.id)).toEqual(['d2', 'd1'])
  })

  it('returns nothing for no rows', () => {
    expect(groupByDinner([])).toEqual([])
  })
})

describe('attachRecipes', () => {
  const dinner = (id: string) => ({id, eatenAt: at, notes: null})
  const link = (dinnerId: string, id: string, name: string) => ({
    dinnerId,
    id,
    name,
    imageUrl: null,
  })

  it('puts each recipe on the dinner it belongs to', () => {
    const result = attachRecipes(
      [dinner('d1'), dinner('d2')],
      [link('d1', 'r1', 'Arepa'), link('d2', 'r2', 'Café')],
    )
    expect(result[0]?.recipes.map(r => r.name)).toEqual(['Arepa'])
    expect(result[1]?.recipes.map(r => r.name)).toEqual(['Café'])
  })

  it('keeps several recipes on one dinner', () => {
    const result = attachRecipes(
      [dinner('d1')],
      [link('d1', 'r1', 'Arepa'), link('d1', 'r2', 'Café')],
    )
    expect(result[0]?.recipes.map(r => r.name)).toEqual(['Arepa', 'Café'])
  })

  /** The recipes come from a second query, which can come back with none. */
  it('leaves a dinner with no recipes empty rather than dropping it', () => {
    const result = attachRecipes([dinner('d1')], [])
    expect(result).toHaveLength(1)
    expect(result[0]?.recipes).toEqual([])
  })

  it('keeps the order the page was read in', () => {
    const result = attachRecipes([dinner('d2'), dinner('d1')], [])
    expect(result.map(d => d.id)).toEqual(['d2', 'd1'])
  })

  /** Page one arrives as a prop and the rest as JSON; only one is a Date. */
  it('hands the date over as an ISO string', () => {
    expect(attachRecipes([dinner('d1')], [])[0]?.eatenAt).toBe(at.toISOString())
  })

  it('ignores a recipe whose dinner is not on this page', () => {
    const result = attachRecipes([dinner('d1')], [link('d9', 'r1', 'Arepa')])
    expect(result[0]?.recipes).toEqual([])
  })
})

describe('dinner cursors', () => {
  it('survives the round trip', () => {
    const cursor = {eatenAt: at, id: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'}
    expect(decodeDinnerCursor(encodeDinnerCursor(cursor))).toEqual(cursor)
  })

  /** Two dinners at the same instant need the id to tell them apart. */
  it('carries the id as well as the time', () => {
    const id = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'
    expect(encodeDinnerCursor({eatenAt: at, id})).toContain(id)
  })

  it('refuses anything it cannot read', () => {
    for (const bad of [
      '',
      'nonsense',
      '2026-10-30T20:00:00.000Z',
      '2026-10-30T20:00:00.000Z|not-a-uuid',
      'not-a-date|0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
      '2026-10-30T20:00:00.000Z|0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b|extra',
    ]) {
      expect(decodeDinnerCursor(bad), bad).toBeNull()
    }
  })
})

describe('the datetime-local clock', () => {
  /** No daylight saving, so every reading is -05:00. */
  it('reads a wall clock in the zone it was typed in', () => {
    expect(
      fromDateTimeLocal('2026-11-01T20:00', 'America/Bogota')?.toISOString(),
    ).toBe('2026-11-02T01:00:00.000Z')
  })

  it('writes the instant back as the same wall clock', () => {
    expect(
      toDateTimeLocal(new Date('2026-11-02T01:00:00Z'), 'America/Bogota'),
    ).toBe('2026-11-01T20:00')
  })

  /** Midnight is 00, not 24. */
  it('writes midnight as the start of the day', () => {
    expect(
      toDateTimeLocal(new Date('2026-11-02T05:00:00Z'), 'America/Bogota'),
    ).toBe('2026-11-02T00:00')
  })

  it('round trips to the minute, whatever the zone', () => {
    for (const zone of ['America/Bogota', 'America/New_York', 'Asia/Tokyo']) {
      const input = '2026-07-04T19:30'
      const instant = fromDateTimeLocal(input, zone)
      expect(instant, zone).not.toBeNull()
      expect(toDateTimeLocal(instant as Date, zone), zone).toBe(input)
    }
  })

  /** One offset lookup gets the clock either side of a change an hour wrong. */
  it('reads either side of a daylight-saving change', () => {
    const summer = fromDateTimeLocal('2026-07-04T19:30', 'America/New_York')
    const winter = fromDateTimeLocal('2026-01-15T19:30', 'America/New_York')
    expect(summer?.toISOString()).toBe('2026-07-04T23:30:00.000Z')
    expect(winter?.toISOString()).toBe('2026-01-16T00:30:00.000Z')
  })

  it('refuses a clock it cannot read', () => {
    for (const bad of ['', 'today', '2026-11-01', '2026-11-01T20:00:30']) {
      expect(fromDateTimeLocal(bad, 'America/Bogota'), bad).toBeNull()
    }
  })
})
