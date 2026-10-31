import {expect, test} from '@playwright/test'

/**
 * The gate, asserted against a real server.
 *
 * These exist because of a bug they would have caught: Auth.js was throwing
 * UntrustedHost on every session read, so nothing could resolve a session and
 * every protected route redirected. The app looked perfectly secure while
 * being entirely broken — the redirects were right by accident.
 *
 * So it is not enough to assert that protected routes redirect. The sign-in
 * page has to render cleanly and the session endpoint has to give a real
 * answer, because those are what distinguish "working" from "failing shut".
 */

test.describe('signed out', () => {
  test('the sign-in page renders and offers GitHub', async ({page}) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole('button', {name: 'Entrar con GitHub'}),
    ).toBeVisible()
    await expect(page.getByRole('heading', {level: 1})).toHaveText(
      'Recetario Mágico',
    )
  })

  // Deny by default: the matcher excludes a short list, so a route that does
  // not exist yet is already private. If someone adds /ingredientes tomorrow
  // without touching middleware, it is protected the moment it is routable.
  for (const path of [
    '/inicio',
    '/recetas',
    '/cenas',
    '/ajustes',
    '/etiquetas',
    '/ingredientes',
    '/claude',
    '/a-route-that-does-not-exist-yet',
  ]) {
    test(`${path} redirects to the sign-in page`, async ({page}) => {
      await page.goto(path)
      await expect(page).toHaveURL('/')
      await expect(
        page.getByRole('button', {name: 'Entrar con GitHub'}),
      ).toBeVisible()
    })
  }

  // The distinguishing check. A broken Auth.js config also produces redirects;
  // only a working one produces a clean null here instead of a 500.
  test('the session endpoint answers rather than erroring', async ({
    request,
  }) => {
    const response = await request.get('/api/auth/session')
    expect(response.status()).toBe(200)
    expect(await response.json()).toBeNull()
  })

  // The sign-in flow itself must stay reachable while signed out, or there is
  // no way in. This is the one path the middleware matcher deliberately skips.
  test('the sign-in route is reachable', async ({request}) => {
    const response = await request.get('/api/auth/signin', {
      maxRedirects: 0,
    })
    expect(response.status()).toBeLessThan(400)
  })
})
