import es from '@/messages/es.json'
import {addRecipe, removeAll, uniqueName} from './db'
import {expect, test} from './signed-in'

/**
 * The unit tests mock the endpoint and stub the observer, so they prove the
 * list asks for a second page and never that the query stops at ten or that
 * scrolling is what asks. Only a real browser against a real database can.
 */

const PAGE_SIZE = 10
const EXTRA = 3

const created: {recipeIds: string[]; ingredientNames: string[]} = {
  recipeIds: [],
  ingredientNames: [],
}

test.afterEach(async () => {
  await removeAll(created)
  created.recipeIds = []
})

/** Newest first, so recipes made now are the first page whatever else exists. */
async function seedRecipes(prefix: string) {
  for (let i = 0; i < PAGE_SIZE + EXTRA; i++) {
    const id = await addRecipe(`${prefix}-${String(i).padStart(2, '0')}`)
    created.recipeIds.push(id)
  }
}

test('the recipe list arrives ten at a time', async ({page}) => {
  const prefix = uniqueName('e2erecipes')
  await seedRecipes(prefix)

  await page.goto('/recipes')
  const mine = page.getByRole('link', {name: new RegExp(prefix)})
  await expect(mine).toHaveCount(PAGE_SIZE)

  await page
    .getByRole('button', {
      name: es.common.loadMore.replace('{count}', String(PAGE_SIZE)),
    })
    .click()
  await expect(mine).toHaveCount(PAGE_SIZE + EXTRA)
})

/**
 * The whole point of appending rather than replacing. A list that jumps back
 * to the top loses the place of whoever was reading it, and the page they
 * just waited for is the one they never see.
 */
test('reading on does not take the list back to the top', async ({page}) => {
  const prefix = uniqueName('e2escroll')
  await seedRecipes(prefix)

  await page.goto('/recipes')
  const mine = page.getByRole('link', {name: new RegExp(prefix)})
  await expect(mine).toHaveCount(PAGE_SIZE)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const before = await page.evaluate(() => window.scrollY)
  expect(before).toBeGreaterThan(0)

  /* Reaching the end is what asks, with no button pressed. */
  await expect(mine).toHaveCount(PAGE_SIZE + EXTRA)
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(
    before,
  )
})
