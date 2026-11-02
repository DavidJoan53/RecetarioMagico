import AxeBuilder from '@axe-core/playwright'
import type {Page} from '@playwright/test'
import {test as anon, expect} from '@playwright/test'
import {addIngredient, removeAll, uniqueName, useInNewRecipe} from './db'
import {test as signedIn} from './signed-in'

/** Zero violations, not a ratchet that only ever climbs. */
async function violations(page: Page) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return results.violations
}

/**
 * Next's error document has no lang attribute, so a page that threw fails as
 * an accessibility violation and reads like one. These say what it actually
 * is. The status alone is not enough — a failure inside Suspense arrives
 * after the shell has streamed, so the response is still 200.
 */
async function scan(page: Page, path: string) {
  const response = await page.goto(path)
  expect(response?.status(), `${path} did not render`).toBe(200)
  await expect(
    page.locator('html'),
    `${path} served the error document, not the layout`,
  ).toHaveAttribute('lang', /\w/)
  expect(page.url()).toContain(path)
  expect(await violations(page), path).toEqual([])
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
  '/dinners/new',
  '/ingredients',
  '/labels',
  '/pantry',
  '/pantry/add',
  '/settings',
]

for (const path of GATED) {
  signedIn(`${path} has no detectable violations`, async ({page}) => {
    await scan(page, path)
  })
}

/**
 * The two routes with an id in them, which no fixed list can reach. They are
 * also where the ingredient rows live — a column of controls all reading
 * "Cantidad" is exactly what a static list of paths would never have seen.
 */
signedIn(
  'a recipe and its edit form have no detectable violations',
  async ({page}) => {
    const ingredientName = uniqueName('e2ea11y')
    const recipeName = uniqueName('e2ea11yreceta')
    const ingredientId = await addIngredient(ingredientName)
    const recipeId = await useInNewRecipe(ingredientId, recipeName)

    try {
      await scan(page, `/recipes/${recipeId}`)
      await scan(page, `/recipes/${recipeId}/edit`)
    } finally {
      await removeAll({
        recipeIds: [recipeId],
        ingredientNames: [ingredientName],
      })
    }
  },
)
