import {expect, test} from '@playwright/test'
import messages from '../messages/es.json'

/**
 * Redirects alone do not prove the gate works — a broken config produces
 * identical ones. The sign-in page rendering and the session endpoint
 * answering are what separate working from failing shut.
 */

test.describe('signed out', () => {
  test('the sign-in page renders and offers GitHub', async ({page}) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole('button', {name: messages.auth.signIn}),
    ).toBeVisible()
    await expect(page.getByRole('heading', {level: 1})).toHaveText(
      messages.app.name,
    )
  })

  /** Deny by default: a route is private before it exists. */
  for (const path of [
    '/home',
    '/recipes',
    '/dinners',
    '/settings',
    '/labels',
    '/pantry',
    '/pantry/add',
    '/ingredients',
    '/claude',
    '/a-route-that-does-not-exist-yet',
  ]) {
    test(`${path} redirects to the sign-in page`, async ({page}) => {
      await page.goto(path)
      await expect(page).toHaveURL('/')
      await expect(
        page.getByRole('button', {name: messages.auth.signIn}),
      ).toBeVisible()
    })
  }

  test('the session endpoint answers rather than erroring', async ({
    request,
  }) => {
    const response = await request.get('/api/auth/session')
    expect(response.status()).toBe(200)
    expect(await response.json()).toBeNull()
  })

  /** The one path the matcher skips; without it there is no way in. */
  test('the sign-in route is reachable', async ({request}) => {
    const response = await request.get('/api/auth/signin', {
      maxRedirects: 0,
    })
    expect(response.status()).toBeLessThan(400)
  })
})
