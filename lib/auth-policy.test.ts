import {describe, expect, it} from 'vitest'
import {isAllowedEmail} from './auth-policy'

const ALLOWED = ['davidjoan53@gmail.com', 'nicolas@cloudnonic.com']

describe('isAllowedEmail', () => {
  it('admits an address on the list', () => {
    expect(isAllowedEmail('davidjoan53@gmail.com', ALLOWED)).toBe(true)
    expect(isAllowedEmail('nicolas@cloudnonic.com', ALLOWED)).toBe(true)
  })

  it('ignores case and whitespace on both sides', () => {
    expect(isAllowedEmail('  DavidJoan53@Gmail.COM ', ALLOWED)).toBe(true)
    expect(
      isAllowedEmail('davidjoan53@gmail.com', ['  DAVIDJOAN53@GMAIL.COM ']),
    ).toBe(true)
  })

  it('refuses an address that is not on the list', () => {
    expect(isAllowedEmail('someone@else.com', ALLOWED)).toBe(false)
  })

  // GitHub omits the email when an account has no verified address. That has
  // to deny, not throw — a crash in the sign-in callback is a broken login
  // rather than a refused one.
  it.each([null, undefined, '', '   '])(
    'refuses %j without throwing',
    value => {
      expect(isAllowedEmail(value, ALLOWED)).toBe(false)
    },
  )

  it('refuses everyone when the list is empty', () => {
    expect(isAllowedEmail('davidjoan53@gmail.com', [])).toBe(false)
  })

  // The check is equality, not inclusion. A substring match would admit
  // anyone who can register an address containing an allowed one.
  it('does not match on a substring', () => {
    expect(isAllowedEmail('davidjoan53@gmail.com.attacker.test', ALLOWED)).toBe(
      false,
    )
    expect(isAllowedEmail('xdavidjoan53@gmail.com', ALLOWED)).toBe(false)
    expect(isAllowedEmail('davidjoan53@gmail.co', ALLOWED)).toBe(false)
  })
})
