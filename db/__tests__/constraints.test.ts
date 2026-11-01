import {describe, expect, it} from 'vitest'
import {isDuplicate, isStillReferenced} from '../constraints'

/** Shaped like what @neondatabase/serverless throws. */
const pgError = (code: string) => Object.assign(new Error('db'), {code})

describe('constraint errors', () => {
  it('recognises a unique violation', () => {
    expect(isDuplicate(pgError('23505'))).toBe(true)
    expect(isStillReferenced(pgError('23505'))).toBe(false)
  })

  it('recognises a foreign key violation', () => {
    expect(isStillReferenced(pgError('23503'))).toBe(true)
    expect(isDuplicate(pgError('23503'))).toBe(false)
  })

  /** A caller rethrows anything unrecognised, so a wrong yes hides a bug. */
  it('says no to anything else', () => {
    for (const value of [
      pgError('42P01'),
      new Error('x'),
      null,
      undefined,
      {},
    ]) {
      expect(isDuplicate(value)).toBe(false)
      expect(isStillReferenced(value)).toBe(false)
    }
  })
})
