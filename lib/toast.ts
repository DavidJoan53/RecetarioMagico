/** What a toast is about: a write that landed, or one that did not. */
export type ToastTone = 'success' | 'error'

export type Toast = {
  id: number
  message: string
  tone: ToastTone
  /** Milliseconds on screen, or null to stay until dismissed. */
  duration: number | null
}

/** What a toast is raised with; the id and the duration are filled in. */
export type ToastInput = {
  message: string
  tone?: ToastTone
  duration?: number | null
}

/** Long enough to read a sentence at an unhurried pace. */
export const SUCCESS_MS = 5000

/**
 * Failures stay until dismissed. An error on a timer is one the reader can
 * miss entirely, and once it has gone there is nothing left on screen to say
 * the write never happened.
 */
export function durationFor(
  tone: ToastTone,
  given?: number | null,
): number | null {
  if (given !== undefined) return given
  return tone === 'error' ? null : SUCCESS_MS
}
