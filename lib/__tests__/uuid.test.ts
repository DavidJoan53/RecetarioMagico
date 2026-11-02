import {afterEach, describe, expect, it, vi} from 'vitest'
import {uuidV7} from '../uuid'

afterEach(() => vi.useRealTimers())

const V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('uuidV7', () => {
  it('is a uuid carrying version 7 and the RFC variant', () => {
    expect(uuidV7()).toMatch(V7)
  })

  /**
   * The whole reason the project uses v7. If the timestamp were not in the
   * high bits, `ORDER BY id` would be random and keyset pagination would
   * silently return the wrong page.
   */
  it('sorts as a string in the order it was made', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const first = uuidV7()
    vi.setSystemTime(new Date('2026-01-01T00:00:01Z'))
    const second = uuidV7()
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'))
    const third = uuidV7()

    expect([third, first, second].sort()).toEqual([first, second, third])
  })

  it('does not repeat itself within a millisecond', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const made = new Set(Array.from({length: 500}, uuidV7))
    expect(made.size).toBe(500)
  })

  /** The timestamp is readable back out, which is what makes it time-ordered. */
  it('writes the current time into the first six bytes', () => {
    vi.useFakeTimers()
    const now = new Date('2026-03-04T05:06:07Z')
    vi.setSystemTime(now)
    const stamp = uuidV7().replace(/-/g, '').slice(0, 12)
    expect(Number.parseInt(stamp, 16)).toBe(now.getTime())
  })
})
