/**
 * Who is allowed in.
 *
 * Kept as a pure function, away from the Auth.js config, so it can be tested
 * without standing up a provider — and so the rule lives in one place rather
 * than being re-expressed at each gate that needs it.
 */

/**
 * GitHub reports whatever address an account has set as primary, and people
 * write their own addresses inconsistently — so both sides are trimmed and
 * lowercased before comparison. An allowlist that is case sensitive fails for
 * exactly the person it exists to admit.
 *
 * A missing email denies rather than throws. GitHub omits it when an account
 * has no verified address, which is a real situation and not a bug.
 */
export function isAllowedEmail(
  email: string | null | undefined,
  allowed: readonly string[],
): boolean {
  if (!email) return false
  const normalised = email.trim().toLowerCase()
  if (!normalised) return false
  return allowed.some(entry => entry.trim().toLowerCase() === normalised)
}
