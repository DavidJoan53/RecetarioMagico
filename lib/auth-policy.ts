/** Compared case-insensitively and trimmed; a missing email denies. */
export function isAllowedEmail(
  email: string | null | undefined,
  allowed: readonly string[],
): boolean {
  if (!email) return false
  const normalised = email.trim().toLowerCase()
  if (!normalised) return false
  return allowed.some(entry => entry.trim().toLowerCase() === normalised)
}
