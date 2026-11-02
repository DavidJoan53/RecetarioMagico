/**
 * Postgres SQLSTATE codes. The database is what decides, not a prior read.
 *
 * ON DELETE RESTRICT raises restrict_violation, not foreign_key_violation —
 * that one is what NO ACTION gives. Both are matched, because the caller only
 * wants to know that something still points at the row.
 */
const UNIQUE_VIOLATION = '23505'
const RESTRICT_VIOLATION = '23001'
const FOREIGN_KEY_VIOLATION = '23503'

/**
 * Drizzle wraps driver errors in DrizzleQueryError and leaves the original on
 * `cause`, so the code is never on the error you are handed.
 */
function codeOf(error: unknown): string | undefined {
  let current = error
  for (let depth = 0; depth < 5; depth++) {
    if (typeof current !== 'object' || current === null) return undefined
    const code = (current as {code?: unknown}).code
    if (typeof code === 'string') return code
    current = (current as {cause?: unknown}).cause
  }
  return undefined
}

export const isDuplicate = (error: unknown) =>
  codeOf(error) === UNIQUE_VIOLATION

export function isStillReferenced(error: unknown): boolean {
  const code = codeOf(error)
  return code === RESTRICT_VIOLATION || code === FOREIGN_KEY_VIOLATION
}

/**
 * The same code read from the other end: a write pointing at a row that is
 * not there, rather than a delete blocked by one that is. A dinner naming a
 * recipe someone deleted while the form was open arrives here.
 */
export const isMissingReference = (error: unknown) =>
  codeOf(error) === FOREIGN_KEY_VIOLATION
