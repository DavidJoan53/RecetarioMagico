import {describe, expect, it} from 'vitest'
import {durationFor, SUCCESS_MS} from '../toast'

describe('durationFor', () => {
  it('gives a success a countdown', () => {
    expect(durationFor('success')).toBe(SUCCESS_MS)
  })

  /**
   * The failure this guards: an error that disappears on a timer leaves
   * nothing on screen to say the write never landed.
   */
  it('leaves a failure on screen until it is dismissed', () => {
    expect(durationFor('error')).toBeNull()
  })

  it('takes an explicit duration over the default', () => {
    expect(durationFor('success', 200)).toBe(200)
  })

  /** null is a choice, not an absence: it has to beat the success default. */
  it('lets a success be made sticky', () => {
    expect(durationFor('success', null)).toBeNull()
  })
})
