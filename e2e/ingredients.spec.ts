import type {Page} from '@playwright/test'
import es from '@/messages/es.json'
import {addIngredient, removeAll, uniqueName, useInNewRecipe} from './db'
import {expect, test} from './signed-in'

const m = es.ingredients

/**
 * What the component tests cannot reach. Every one of them mocks the server
 * action, so the chain from a click through validation, Drizzle, the schema's
 * own constraints and back into a re-rendered list is covered nowhere else.
 */

const created: {recipeIds: string[]; ingredientNames: string[]} = {
  recipeIds: [],
  ingredientNames: [],
}

test.afterEach(async () => {
  await removeAll(created)
  created.recipeIds = []
  created.ingredientNames = []
})

/**
 * A server-rendered button is clickable before React attaches to it. Click it
 * then and the form posts natively, the page navigates, and none of the
 * client state these tests assert on is ever created. React tags the DOM as
 * it hydrates, so that is the thing to wait for.
 */
async function open(page: Page, path = '/ingredients') {
  await page.goto(path)
  await page.waitForFunction(() => {
    const form = document.querySelector('form')
    return !!form && Object.keys(form).some(k => k.startsWith('__react'))
  })
}

async function fillAndAdd(page: Page, name: string) {
  created.ingredientNames.push(name)
  await addForm(page).getByRole('textbox', {name: m.name}).fill(name)
  await page.getByRole('button', {name: `+ ${m.add}`}).click()
}

const addForm = (page: Page) => page.getByRole('form', {name: m.addTitle})

const rowFor = (page: Page, name: string) =>
  page.getByRole('listitem').filter({hasText: name})

/** Two live regions share the page: the form's, and the list's for deletions. */
const formStatus = (page: Page) => addForm(page).getByRole('status')

const announcement = (page: Page, text: string) =>
  page.getByRole('status').filter({hasText: text})

test('an added ingredient is saved and comes back in the list', async ({
  page,
}) => {
  const name = uniqueName('e2e-tomate')
  await open(page)
  await fillAndAdd(page, name)

  await expect(formStatus(page)).toHaveText(m.added)
  await expect(rowFor(page, name)).toBeVisible()

  /* Reloaded, because the row appearing could be optimistic. */
  await page.reload()
  await expect(rowFor(page, name)).toBeVisible()
})

test('the unique index refuses a second ingredient with the same name', async ({
  page,
}) => {
  const name = uniqueName('e2e-duplicado')
  await open(page)
  await fillAndAdd(page, name)
  await expect(formStatus(page)).toHaveText(m.added)

  await fillAndAdd(page, name)
  await expect(addForm(page).getByRole('alert')).toHaveText(m.duplicate)
})

test('a rename is written and survives a reload', async ({page}) => {
  const before = uniqueName('e2e-antes')
  const after = uniqueName('e2e-despues')
  created.ingredientNames.push(after)

  await open(page)
  await fillAndAdd(page, before)
  await expect(rowFor(page, before)).toBeVisible()

  await page.getByRole('button', {name: `${m.edit} ${before}`}).click()
  /* Scoped: the create form at the top has a Nombre field of its own. */
  const editing = page.getByRole('form', {name: `${m.edit} ${before}`})
  await editing.getByRole('textbox', {name: m.name}).fill(after)
  await editing.getByRole('button', {name: m.save}).click()

  await expect(rowFor(page, after)).toBeVisible()
  await page.reload()
  await expect(rowFor(page, after)).toBeVisible()
  await expect(rowFor(page, before)).toHaveCount(0)
})

test('a deleted ingredient is gone, and the going is announced', async ({
  page,
}) => {
  const name = uniqueName('e2e-borrar')
  await open(page)
  await fillAndAdd(page, name)
  await expect(rowFor(page, name)).toBeVisible()

  await page.getByRole('button', {name: `${m.delete} ${name}`}).click()
  await page.getByRole('button', {name: m.confirmDeleteAction}).click()

  /* The row unmounts, so this message is the only word the user gets. */
  await expect(announcement(page, `${name} eliminado`)).toHaveCount(1)
  await expect(rowFor(page, name)).toHaveCount(0)
  await page.reload()
  await expect(rowFor(page, name)).toHaveCount(0)
})

/**
 * The reason this file exists, and it earned its keep immediately: the catch
 * in db/ingredients/delete-ingredient was looking for 23503 on the error it
 * was handed, and Postgres raises 23001 for RESTRICT, wrapped by Drizzle. A
 * mocked action proves the message renders. Only this proves the constraint
 * fires and that what it throws is understood.
 */
test('an ingredient a recipe uses cannot be deleted, and is told why', async ({
  page,
}) => {
  const name = uniqueName('e2e-en-uso')
  created.ingredientNames.push(name)
  const id = await addIngredient(name)
  created.recipeIds.push(await useInNewRecipe(id, uniqueName('e2e-receta')))

  await open(page)
  await page.getByRole('button', {name: `${m.delete} ${name}`}).click()
  await page.getByRole('button', {name: m.confirmDeleteAction}).click()

  await expect(rowFor(page, name).getByRole('alert')).toHaveText(/1 receta/)
  await page.reload()
  await expect(rowFor(page, name)).toBeVisible()
})
