import {test as base} from '@playwright/test'
import {encode} from 'next-auth/jwt'

/** Auth.js salts the JWE with the cookie name, so the two must agree. */
const COOKIE = 'authjs.session-token'

/**
 * Signs in without GitHub. The session is a JWT cookie and nothing reads a
 * user table, so a cookie minted with AUTH_SECRET is indistinguishable from
 * one issued by a real sign-in — the app still re-checks the allowlist.
 */
export const test = base.extend({
  page: async ({page}, use) => {
    const email = process.env.ALLOWED_EMAILS?.split(',')[0]?.trim()
    const secret = process.env.AUTH_SECRET
    if (!email || !secret) throw new Error('ALLOWED_EMAILS and AUTH_SECRET')

    const token = await encode({
      token: {email, sub: email},
      secret,
      salt: COOKIE,
      maxAge: 60 * 60,
    })

    await page
      .context()
      .addCookies([
        {name: COOKIE, value: token, domain: 'localhost', path: '/'},
      ])
    await use(page)
  },
})

export {expect} from '@playwright/test'
