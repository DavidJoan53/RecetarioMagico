import AxeBuilder from '@axe-core/playwright'
import {expect, test} from '@playwright/test'

/** Zero violations, not a ratchet that only ever climbs. */
test('home page has no detectable accessibility violations', async ({page}) => {
  await page.goto('/')
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
