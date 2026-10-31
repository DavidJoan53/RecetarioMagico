import AxeBuilder from '@axe-core/playwright'
import {expect, test} from '@playwright/test'

/**
 * The accessibility gate. This runs against every route as they arrive, and
 * the assertion is zero violations rather than "no new violations" — a
 * threshold that only ever ratchets upward is not a gate.
 */
test('home page has no detectable accessibility violations', async ({page}) => {
  await page.goto('/')
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
