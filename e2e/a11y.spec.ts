import AxeBuilder from '@axe-core/playwright'
import type {Page} from '@playwright/test'
import {test as anon, expect} from '@playwright/test'
import {test as signedIn} from './signed-in'

/** Zero violations, not a ratchet that only ever climbs. */
async function violations(page: Page) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return results.violations
}

anon('the sign-in page has no detectable violations', async ({page}) => {
  await page.goto('/')
  expect(await violations(page)).toEqual([])
})

/**
 * Asserted before the scans below. If the cookie stopped working every one of
 * them would redirect to `/` and pass against a page they never reached.
 */
signedIn('the session fixture reaches a gated page', async ({page}) => {
  await page.goto('/home')
  await expect(page).toHaveURL(/\/home$/)
})

const GATED = [
  '/home',
  '/recipes',
  '/recipes/new',
  '/dinners',
  '/ingredients',
  '/settings',
]

for (const path of GATED) {
  signedIn(`${path} has no detectable violations`, async ({page}) => {
    await page.goto(path)
    expect(page.url()).toContain(path)
    expect(await violations(page)).toEqual([])
  })
}
