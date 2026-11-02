import type {Page} from '@playwright/test'
import es from '../messages/es.json'

/**
 * A toast, located by its dismiss button.
 *
 * Not by its text: the message is in the page twice on purpose — once in the
 * live region that announces it, once in the toast's own aria-hidden
 * paragraph for people reading it. Matching on text matches both and trips
 * strict mode, which reads like the toast being wrong rather than there
 * being two of it.
 */
export const toast = (page: Page, message: string) =>
  page.getByRole('button', {
    name: es.toast.dismiss.replace('{message}', message),
  })
