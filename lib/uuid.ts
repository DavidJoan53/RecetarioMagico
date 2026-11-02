/**
 * uuid v7, the same shape the `uuidv7()` column default writes: 48 bits of
 * millisecond timestamp, then randomness, so ids sort chronologically.
 *
 * Minted here rather than by Postgres when a write needs the id before it
 * runs. The driver is neon-http, which has no interactive transactions — only
 * `db.batch`, and a batch cannot feed a returned id into its next statement.
 * Knowing the id up front is what lets a recipe and its ingredients be one
 * atomic write instead of two that can half-fail.
 */
export function uuidV7(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  /* Big-endian across the first six bytes. Shifts are not used: `ms` exceeds
     32 bits, and bitwise operators in JS truncate to 32. */
  let ms = Date.now()
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256
    ms = Math.floor(ms / 256)
  }

  /* The four version bits and the two variant bits RFC 9562 fixes; the rest
     of both bytes stays random. */
  bytes[6] = ((bytes[6] as number) & 0x0f) | 0x70
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}
