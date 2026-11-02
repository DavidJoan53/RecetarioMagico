import {describe, expect, it} from 'vitest'
import {dinnerInputFromForm} from '../validation/dinner'

const RECIPE = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'
const OTHER = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c'

function form(fields: Record<string, string | string[]>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    for (const one of Array.isArray(value) ? value : [value]) {
      data.append(key, one)
    }
  }
  return data
}

const valid = {
  eatenAt: '2026-11-02T01:00:00.000Z',
  notes: 'Rico',
  recipeIds: [RECIPE],
}

describe('dinnerInputFromForm', () => {
  it('reads a filled form', () => {
    const parsed = dinnerInputFromForm(form(valid))
    expect(parsed.success).toBe(true)
    expect(parsed.data?.eatenAt.toISOString()).toBe(valid.eatenAt)
    expect(parsed.data?.notes).toBe('Rico')
    expect(parsed.data?.recipeIds).toEqual([RECIPE])
  })

  it('takes notes as optional', () => {
    const parsed = dinnerInputFromForm(form({...valid, notes: '   '}))
    expect(parsed.data?.notes).toBeNull()
  })

  it('keeps every recipe chosen', () => {
    const parsed = dinnerInputFromForm(
      form({...valid, recipeIds: [RECIPE, OTHER]}),
    )
    expect(parsed.data?.recipeIds).toEqual([RECIPE, OTHER])
  })

  /** The pair is the primary key, so the insert would fail on a repeat. */
  it('drops a recipe named twice', () => {
    const parsed = dinnerInputFromForm(
      form({...valid, recipeIds: [RECIPE, RECIPE]}),
    )
    expect(parsed.data?.recipeIds).toEqual([RECIPE])
  })

  /** A dinner holding no recipe records nothing. */
  it('refuses a dinner with no recipes', () => {
    const data = form(valid)
    data.delete('recipeIds')
    expect(dinnerInputFromForm(data).success).toBe(false)
  })

  /**
   * The wall clock the input gives back, unconverted. Read here it would be
   * called UTC, and the dinner would land hours from when it was eaten.
   */
  it('refuses a time with no zone on it', () => {
    const parsed = dinnerInputFromForm(
      form({...valid, eatenAt: '2026-11-01T20:00'}),
    )
    expect(parsed.success).toBe(false)
  })

  it('refuses a missing or unreadable time', () => {
    for (const eatenAt of ['', 'ayer', '2026-11-01']) {
      expect(
        dinnerInputFromForm(form({...valid, eatenAt})).success,
        eatenAt,
      ).toBe(false)
    }
  })

  /** Nothing submitted at all — every field reads as absent, not as null. */
  it('refuses an empty form rather than throwing on it', () => {
    const parsed = dinnerInputFromForm(new FormData())
    expect(parsed.success).toBe(false)
  })

  it('refuses something that is not a recipe id', () => {
    expect(
      dinnerInputFromForm(form({...valid, recipeIds: ['tomate']})).success,
    ).toBe(false)
  })

  it('refuses notes longer than the column takes', () => {
    const parsed = dinnerInputFromForm(form({...valid, notes: 'a'.repeat(501)}))
    expect(parsed.success).toBe(false)
  })
})
