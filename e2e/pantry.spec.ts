import es from '@/messages/es.json'
import {addIngredient, removeAll, uniqueName} from './db'
import {expect, test} from './signed-in'

const m = es.pantry

/**
 * The combobox pages, and nothing else can show that: the unit tests mock the
 * endpoint, so they prove the component asks for a second page, never that
 * the query stops at the first ten.
 */

const created: {recipeIds: string[]; ingredientNames: string[]} = {
  recipeIds: [],
  ingredientNames: [],
}

test.afterEach(async () => {
  await removeAll(created)
  created.ingredientNames = []
})

const PAGE_SIZE = 10

test('the ingredient list arrives ten at a time', async ({page}) => {
  /* A shared prefix so the search returns these and nothing else. */
  const prefix = uniqueName('e2epage')
  for (let i = 0; i < PAGE_SIZE + 3; i++) {
    const name = `${prefix}-${String(i).padStart(2, '0')}`
    created.ingredientNames.push(name)
    await addIngredient(name)
  }

  await page.goto('/pantry/add')
  const input = page.getByRole('combobox', {name: m.ingredient})
  await input.fill(prefix)

  /* Scoped to the list box. The unit select is a combobox too, and its
     seven units plus the placeholder are options — counting them made a
     capped list of ten look like eighteen. */
  const options = page.getByRole('listbox').getByRole('option')
  await expect(options.first()).toContainText(prefix)
  await expect(options).toHaveCount(PAGE_SIZE)

  /* Scrolling the last one into view is what asks for the next page. */
  await options.last().scrollIntoViewIfNeeded()
  await expect(options).toHaveCount(PAGE_SIZE + 3)
})

test('a search narrows to what matches', async ({page}) => {
  const prefix = uniqueName('e2efind')
  for (const suffix of ['alpha', 'beta']) {
    const name = `${prefix}-${suffix}`
    created.ingredientNames.push(name)
    await addIngredient(name)
  }

  await page.goto('/pantry/add')
  await page.getByRole('combobox', {name: m.ingredient}).fill(`${prefix}-alpha`)

  const options = page.getByRole('listbox').getByRole('option')
  await expect(options.first()).toContainText('alpha')
  await expect(options).toHaveCount(1)
})
