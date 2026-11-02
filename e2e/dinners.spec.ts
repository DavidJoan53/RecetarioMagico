import type {Page} from '@playwright/test'
import es from '@/messages/es.json'
import {addRecipe, removeAll, uniqueName} from './db'
import {expect, test} from './signed-in'

const m = es.dinners

/**
 * What the component tests cannot reach. Every one of them mocks the server
 * action, so the chain from a click through validation, the two-statement
 * batch the HTTP driver needs, the composite primary key on dinner_recipes
 * and back into a re-rendered list is covered nowhere else.
 */

const created: {
  recipeIds: string[]
  ingredientNames: string[]
  dinnerNotes: string[]
} = {recipeIds: [], ingredientNames: [], dinnerNotes: []}

test.afterEach(async () => {
  await removeAll(created)
  created.recipeIds = []
  created.dinnerNotes = []
})

/**
 * A server-rendered button is clickable before React attaches to it. Click it
 * then and the form posts natively, the page navigates, and none of the
 * client state these tests assert on is ever created.
 */
async function open(page: Page) {
  await page.goto('/dinners')
  await page.waitForFunction(() => {
    const form = document.querySelector('form')
    return !!form && Object.keys(form).some(k => k.startsWith('__react'))
  })
}

const addForm = (page: Page) => page.getByRole('form', {name: m.addTitle})

/** A recipe of its own, so the list can be narrowed to this test's rows. */
async function ownRecipe(): Promise<string> {
  const name = uniqueName('e2ecena')
  created.recipeIds.push(await addRecipe(name))
  return name
}

async function pickRecipe(page: Page, name: string) {
  await addForm(page).getByRole('combobox', {name: m.recipes}).fill(name)
  await page.getByRole('listbox').getByRole('option', {name}).click()
}

async function logDinner(page: Page, recipe: string, notes: string) {
  created.dinnerNotes.push(notes)
  await addForm(page).getByLabel(m.when).fill('2026-11-01T20:00')
  await pickRecipe(page, recipe)
  await addForm(page).getByLabel(m.notes).fill(notes)
  await page.getByRole('button', {name: `+ ${m.add}`}).click()
}

const list = (page: Page) => page.getByRole('list', {name: m.listLabel})

/**
 * The row's controls are named after the dinner they act on, not after the
 * word on them — an aria-label replaces the text rather than adding to it.
 */
const rowButton = (key: 'editLabel' | 'deleteLabel') =>
  new RegExp(`^${m[key].split('{date}')[0]}`)

test('logs a dinner, shows it in the list, and takes it off again', async ({
  page,
}) => {
  const recipe = await ownRecipe()
  const notes = uniqueName('nota')
  await open(page)

  await logDinner(page, recipe, notes)
  await expect(page.getByText(m.added)).toBeVisible()

  const row = list(page).getByRole('listitem').filter({hasText: notes}).first()
  await expect(row).toBeVisible()
  /* The recipe came back from the join, not from what was typed. */
  await expect(row.getByText(recipe)).toBeVisible()

  await row.getByRole('button', {name: rowButton('deleteLabel')}).click()
  await expect(page.getByText(m.keepsRecipes)).toBeVisible()
  await page.getByRole('button', {name: m.confirmDeleteAction}).click()

  await expect(page.getByText(notes)).toBeHidden()
})

/** The write is one batch; a failed half would leave a dinner recording none. */
test('keeps the dinner and its recipes together', async ({page}) => {
  const recipe = await ownRecipe()
  const notes = uniqueName('junta')
  await open(page)
  await logDinner(page, recipe, notes)

  const row = list(page).getByRole('listitem').filter({hasText: notes}).first()
  await expect(row.getByText(recipe)).toBeVisible()

  /* Reloaded, so what is asserted is what the database holds rather than
     what the form left on screen. */
  await page.reload()
  const reloaded = list(page)
    .getByRole('listitem')
    .filter({hasText: notes})
    .first()
  await expect(reloaded.getByText(recipe)).toBeVisible()
})

/** The edit form is the create form, filled in — and it replaces the set. */
test('edits a dinner in a form that starts from what is there', async ({
  page,
}) => {
  const first = await ownRecipe()
  const second = await ownRecipe()
  const notes = uniqueName('editar')
  await open(page)
  await logDinner(page, first, notes)

  const row = list(page).getByRole('listitem').filter({hasText: notes}).first()
  await row.getByRole('button', {name: rowButton('editLabel')}).click()

  const editing = page.getByRole('form', {name: /Editar la cena/})
  await expect(editing.getByLabel(m.when)).toHaveValue('2026-11-01T20:00')
  await expect(editing.getByLabel(m.notes)).toHaveValue(notes)

  /* Swap the recipe: the update deletes the pairings and writes them again,
     so this proves the old one actually went. */
  await editing
    .getByRole('button', {name: m.removeRecipe.replace('{name}', first)})
    .click()
  await editing.getByRole('combobox', {name: m.recipes}).fill(second)
  await page.getByRole('listbox').getByRole('option', {name: second}).click()
  await editing.getByRole('button', {name: m.save}).click()
  /* The row is a form until this goes; read it before then and the form's
     own live region answers instead of the list. */
  await expect(editing).toBeHidden()

  const saved = list(page)
    .getByRole('listitem')
    .filter({hasText: notes})
    .first()
    .getByRole('list', {name: new RegExp(`^${m.recipesOn.split('{date}')[0]}`)})
  await expect(saved).toContainText(second)
  await expect(saved).not.toContainText(first)
})

/** A dinner recording no recipe records nothing, so the form refuses it. */
test('refuses a dinner with no recipe on it', async ({page}) => {
  await open(page)
  await addForm(page).getByLabel(m.when).fill('2026-11-01T20:00')
  await expect(addForm(page).getByText(m.noneChosen)).toBeVisible()

  await page.getByRole('button', {name: `+ ${m.add}`}).click()

  /* Scoped to the form: Next's route announcer is an alert too. */
  await expect(addForm(page).getByRole('alert')).toHaveText(m.invalid)
  await expect(page.getByText(m.added)).toBeHidden()
})
