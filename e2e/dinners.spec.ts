import type {Page} from '@playwright/test'
import es from '@/messages/es.json'
import {addRecipe, removeAll, uniqueName} from './db'
import {expect, test} from './signed-in'
import {toast} from './toast'

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
 * A server-rendered control is clickable before React attaches to it. Click
 * it then and a button does nothing at all, or a form posts natively and
 * navigates — and none of the client state these tests assert on is ever
 * created. React tags the DOM as it hydrates, so that is the thing to wait
 * for.
 */
async function hydrated(page: Page, selector: string) {
  await page.waitForFunction(one => {
    const node = document.querySelector(one)
    return !!node && Object.keys(node).some(k => k.startsWith('__react'))
  }, selector)
}

/** The form lives on its own route; the list is what /dinners holds. */
async function openNew(page: Page) {
  await page.goto('/dinners/new')
  await hydrated(page, 'form')
}

/**
 * A row carries buttons that do nothing until React attaches, so it is worth
 * waiting for. The empty state is a server-rendered paragraph with nothing to
 * hydrate and no row to wait for — waiting on one anyway would hang until the
 * timeout and report an empty list as a page that never rendered.
 */
async function listReady(page: Page) {
  await page.waitForFunction(
    ({rows, empty}) => {
      const row = document.querySelector(rows)
      if (!row) return document.body.textContent?.includes(empty) === true
      return Object.keys(row).some(k => k.startsWith('__react'))
    },
    {rows: `ul[aria-label="${m.listLabel}"] li`, empty: m.empty},
  )
}

async function openList(page: Page) {
  await page.goto('/dinners')
  await listReady(page)
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
  /* Waited for here, not left to the caller. The form is its own route now,
     so every caller leaves it — and leaving before the action resolves
     abandons it mid-flight, so the dinner is never written and the failure
     lands on the list, which looks like the list being wrong. */
  await expect(toast(page, m.added)).toBeVisible()
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
  await openNew(page)

  await logDinner(page, recipe, notes)

  await openList(page)
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
  await openNew(page)
  await logDinner(page, recipe, notes)

  await openList(page)
  const row = list(page).getByRole('listitem').filter({hasText: notes}).first()
  await expect(row.getByText(recipe)).toBeVisible()

  /* Reloaded, so what is asserted is what the database holds rather than
     what the form left on screen. */
  await page.reload()
  await listReady(page)
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
  await openNew(page)
  await logDinner(page, first, notes)

  await openList(page)
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
  await openNew(page)
  await addForm(page).getByLabel(m.when).fill('2026-11-01T20:00')
  await expect(addForm(page).getByText(m.noneChosen)).toBeVisible()

  await page.getByRole('button', {name: `+ ${m.add}`}).click()

  /* Scoped to the form: Next's route announcer is an alert too. */
  await expect(addForm(page).getByRole('alert')).toHaveText(m.invalid)
  await expect(toast(page, m.added)).toBeHidden()
})

/**
 * The list formats through next-intl and the form writes against the zone
 * constant. They agree only while the configured zone actually reaches a
 * client component; without it the row renders in one zone and the form it
 * opens in another, and nothing says so. Tokyo is what rules out the
 * browser's own zone — left to it, this row would read 10:00.
 *
 * Run on a machine already in America/Bogota it cannot tell the configured
 * zone from the server's default, because both are the same answer. With the
 * server in UTC — a runner, or TZ=UTC — it reads 1:00 and fails, which is
 * where the teeth are.
 */
test.describe('read from another timezone', () => {
  test.use({timezoneId: 'Asia/Tokyo'})

  test('shows and edits one dinner in the house clock', async ({page}) => {
    const recipe = await ownRecipe()
    const notes = uniqueName('tokio')
    await openNew(page)
    await logDinner(page, recipe, notes)

    await openList(page)
    const row = list(page)
      .getByRole('listitem')
      .filter({hasText: notes})
      .first()
    await expect(row.getByRole('time')).toContainText('20:00')
    await expect(row.getByRole('time')).not.toContainText('10:00')

    await row.getByRole('button', {name: rowButton('editLabel')}).click()
    await expect(
      page.getByRole('form', {name: /Editar la cena/}).getByLabel(m.when),
    ).toHaveValue('2026-11-01T20:00')
  })
})
