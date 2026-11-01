/** Postgres SQLSTATE codes. The database is what decides, not a prior read. */
const UNIQUE_VIOLATION = '23505'
const FOREIGN_KEY_VIOLATION = '23503'

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as {code?: unknown}).code === code
  )
}

export const isDuplicate = (error: unknown) => hasCode(error, UNIQUE_VIOLATION)
export const isStillReferenced = (error: unknown) =>
  hasCode(error, FOREIGN_KEY_VIOLATION)
