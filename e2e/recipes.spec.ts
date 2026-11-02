import type {Page} from '@playwright/test'
import es from '@/messages/es.json'
import {addIngredient, addRecipe, removeAll, uniqueName} from './db'
import {expect, test} from './signed-in'

/**
 * The unit tests mock the endpoint and stub the observer, so they prove the
 * list asks for a second page and never that the query stops at ten or that
 * scrolling is what asks. Only a real browser against a real database can.
 */

const PAGE_SIZE = 10
const EXTRA = 3

const created: {
  recipeIds: string[]
  ingredientNames: string[]
  recipeNames: string[]
} = {recipeIds: [], ingredientNames: [], recipeNames: []}

test.afterEach(async () => {
  await removeAll(created)
  created.recipeIds = []
  created.ingredientNames = []
  created.recipeNames = []
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

/**
 * What no component test can reach. They mock the server action, so they
 * prove a FormData was built and never that the three parallel fields stayed
 * in step through Drizzle, the unique index and back out of a real read.
 */

const f = es.recipeForm
const r = es.recipe

/**
 * A server-rendered button is clickable before React attaches to it. Click it
 * then and the form posts natively, losing every row the picker holds in
 * client state.
 */
async function openForm(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => {
    const form = document.querySelector('form')
    return !!form && Object.keys(form).some(k => k.startsWith('__react'))
  })
}

/** Adds a row, picks an ingredient into it, and fills in its amount. */
async function addIngredientRow(
  page: Page,
  row: number,
  name: string,
  quantity: string,
  unit: string,
) {
  await page.getByRole('button', {name: `+ ${f.addIngredient}`}).click()

  /* Exact: Playwright matches a name by substring, and "Ingrediente 1" is
     inside "Unidad de Ingrediente 1" — the unit select for the same row. */
  const picker = page.getByRole('combobox', {
    name: f.ingredientN.replace('{n}', String(row)),
    exact: true,
  })
  await picker.fill(name)
  await page.getByRole('listbox').getByRole('option', {name}).click()

  /* Named after the ingredient once there is one, which is the whole point
     of the row labels — a column of "Cantidad" could not be told apart. */
  await page
    .getByRole('spinbutton', {name: f.quantityOf.replace('{name}', name)})
    .fill(quantity)
  await page
    .getByRole('combobox', {name: f.unitOf.replace('{name}', name)})
    .selectOption(unit)
}

const ingredientRow = (page: Page, name: string) =>
  page.getByRole('listitem').filter({hasText: name})

test('a recipe is created with its ingredients and reads them back', async ({
  page,
}) => {
  const tomato = uniqueName('e2etomate')
  const onion = uniqueName('e2ecebolla')
  const recipeName = uniqueName('e2ereceta')
  created.ingredientNames.push(tomato, onion)
  created.recipeNames.push(recipeName)
  await addIngredient(tomato)
  await addIngredient(onion)

  await openForm(page, '/recipes/new')
  await page.getByRole('textbox', {name: f.name}).fill(recipeName)
  await addIngredientRow(page, 1, tomato, '200', 'g')
  await addIngredientRow(page, 2, onion, '1', 'unidad')
  await page.getByRole('button', {name: f.create}).click()

  /* The action redirects to the recipe it just wrote, so arriving here is
     itself the proof that the id came back. */
  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}$/)
  await expect(
    page.getByRole('heading', {name: recipeName, level: 1}),
  ).toBeVisible()

  /* Each amount against its own ingredient. A row that drifted would show
     "1 unidad" of tomato and look perfectly plausible. */
  await expect(ingredientRow(page, tomato)).toContainText('200 g')
  await expect(ingredientRow(page, onion)).toContainText('1 unidad')

  /* Reloaded: everything above could still be the form's own state. */
  await page.reload()
  await expect(ingredientRow(page, tomato)).toContainText('200 g')
})

test('the list shows what a recipe is made of', async ({page}) => {
  const tomato = uniqueName('e2etomate')
  const recipeName = uniqueName('e2ereceta')
  created.ingredientNames.push(tomato)
  created.recipeNames.push(recipeName)
  await addIngredient(tomato)

  await openForm(page, '/recipes/new')
  await page.getByRole('textbox', {name: f.name}).fill(recipeName)
  await addIngredientRow(page, 1, tomato, '200', 'g')
  await page.getByRole('button', {name: f.create}).click()
  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}$/)

  await page.goto('/recipes')
  await expect(page.getByText(`${tomato} 200 g`)).toBeVisible()

  /* Beside the link, never inside it: everything within a link becomes its
     accessible name, and a list of them would read as a wall of text. */
  await expect(
    page.getByRole('link', {name: new RegExp(recipeName)}),
  ).not.toContainText(tomato)
})

test('an edited amount replaces the old one rather than adding a row', async ({
  page,
}) => {
  const tomato = uniqueName('e2etomate')
  const recipeName = uniqueName('e2ereceta')
  created.ingredientNames.push(tomato)
  created.recipeNames.push(recipeName)
  await addIngredient(tomato)

  await openForm(page, '/recipes/new')
  await page.getByRole('textbox', {name: f.name}).fill(recipeName)
  await addIngredientRow(page, 1, tomato, '200', 'g')
  await page.getByRole('button', {name: f.create}).click()
  await expect(ingredientRow(page, tomato)).toContainText('200 g')

  await page.getByRole('link', {name: r.edit}).click()
  /* The form opens on what the recipe says, so the row is already there. */
  await expect(
    page.getByRole('combobox', {
      name: f.ingredientN.replace('{n}', '1'),
      exact: true,
    }),
  ).toHaveValue(tomato)

  await page
    .getByRole('spinbutton', {name: f.quantityOf.replace('{name}', tomato)})
    .fill('350')
  await page.getByRole('button', {name: f.save}).click()

  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}$/)
  /* One row, not two: the set is replaced, and the unique index is what
     makes a second row for the same ingredient impossible anyway. */
  await expect(ingredientRow(page, tomato)).toHaveCount(1)
  await expect(ingredientRow(page, tomato)).toContainText('350 g')
})

test('an ingredient already in the recipe is marked in the picker', async ({
  page,
}) => {
  const tomato = uniqueName('e2etomate')
  created.ingredientNames.push(tomato)
  await addIngredient(tomato)

  await openForm(page, '/recipes/new')
  await addIngredientRow(page, 1, tomato, '200', 'g')

  await page.getByRole('button', {name: `+ ${f.addIngredient}`}).click()
  await page
    .getByRole('combobox', {
      name: f.ingredientN.replace('{n}', '2'),
      exact: true,
    })
    .fill(tomato)

  /* Marked rather than hidden: a missing option makes "no such ingredient"
     and "you already picked it" look the same. */
  await expect(
    page
      .getByRole('listbox')
      .getByRole('option', {name: `${tomato} ${f.alreadyInRecipe}`}),
  ).toBeVisible()
})

test('a recipe that does not exist is a 404, not a server error', async ({
  page,
}) => {
  /* Not a uuid, so without the guard this reaches Postgres as a uuid
     comparison and raises — a 500 for what is plainly a 404. */
  const response = await page.goto('/recipes/no-such-recipe')
  expect(response?.status()).toBe(404)
})
