import {describe, expect, it} from 'vitest'
import {groupByDinner} from '../dinners'

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
