import {describe, expect, it} from 'vitest'
import {isDuplicate, isStillReferenced} from '../constraints'

/**
 * The shape Drizzle actually throws, measured against Postgres rather than
 * assumed: DrizzleQueryError carrying the driver's NeonDbError on `cause`.
 * The first version of this file asserted a bare {code} and passed happily
 * while the real thing went unrecognised.
 */
const thrown = (code: string) =>
  Object.assign(new Error('Failed query'), {
    cause: Object.assign(new Error('db'), {code}),
  })

describe('constraint errors', () => {
  it('finds the code through the wrapper', () => {
    expect(isDuplicate(thrown('23505'))).toBe(true)
    expect(isStillReferenced(thrown('23503'))).toBe(true)
  })

  /** ON DELETE RESTRICT raises this one; NO ACTION is what gives 23503. */
  it('treats a restrict violation as still referenced', () => {
    expect(isStillReferenced(thrown('23001'))).toBe(true)
  })

  it('still reads a bare driver error, in case nothing wraps it', () => {
    expect(isDuplicate(Object.assign(new Error('db'), {code: '23505'}))).toBe(
      true,
    )
  })

  it('keeps the two apart', () => {
    expect(isStillReferenced(thrown('23505'))).toBe(false)
    expect(isDuplicate(thrown('23001'))).toBe(false)
    expect(isDuplicate(thrown('23503'))).toBe(false)
  })

  /** A caller rethrows anything unrecognised, so a wrong yes hides a bug. */
  it('says no to anything else', () => {
    for (const value of [
      thrown('42P01'),
      new Error('x'),
      null,
      undefined,
      {},
    ]) {
      expect(isDuplicate(value)).toBe(false)
      expect(isStillReferenced(value)).toBe(false)
    }
  })

  /** Errors chain, but not forever — a cycle must not hang the request. */
  it('gives up rather than walking a cycle', () => {
    const loop: {cause?: unknown} = {}
    loop.cause = loop
    expect(isDuplicate(loop)).toBe(false)
  })
})
