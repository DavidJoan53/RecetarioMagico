import {loadEnvConfig} from '@next/env'
import {defineConfig, devices} from '@playwright/test'

/** The runner is not Next, so .env.local needs loading to mint a session. */
loadEnvConfig(process.cwd())

/**
 * These tests write, and they inherited DATABASE_URL from .env.local — which
 * is the real database. They left rows in the live app before anyone noticed.
 *
 * The suite now needs a database of its own and refuses to start without one,
 * because the failure is silent: everything passes, and the damage is only
 * visible to whoever opens the app later.
 */
const testDatabase = process.env.E2E_DATABASE_URL
if (!testDatabase) {
  throw new Error(
    'E2E_DATABASE_URL is not set. These tests create and delete rows, so they\n' +
      'need their own database — use the `ci` Neon branch, never the one in\n' +
      'DATABASE_URL. Add it to .env.local.',
  )
}
/**
 * Every worker loads this file again, inheriting the environment the first
 * pass already rewrote — so by then the two always match and the check fires
 * on its own handiwork. The marker is what tells the second pass apart from
 * a laptop genuinely pointed at the live database.
 *
 * Only ever seen locally: CI skips the comparison, so the suite there never
 * reached it.
 */
const swapped = process.env.E2E_DATABASE_SWAPPED === '1'

/**
 * Not on a runner, where both are the throwaway branch on purpose — there is
 * no second database there to protect. This guards a laptop, where the other
 * one is the app people are using.
 */
if (!process.env.CI && !swapped && testDatabase === process.env.DATABASE_URL) {
  throw new Error(
    'E2E_DATABASE_URL is the same database the app uses. Point it at the `ci`\n' +
      'branch instead.',
  )
}

/** Everything downstream reads DATABASE_URL, so there is one value to get right. */
process.env.DATABASE_URL = testDatabase
process.env.E2E_DATABASE_SWAPPED = '1'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  /**
   * Every page here reads Postgres over HTTP, against a Neon branch capped at
   * 0.25 CU. Left to choose, Playwright ran six browsers and Neon began
   * refusing connections — which surfaces as the app failing to render, so it
   * reads like a bug in the page rather than a limit being hit. One at a time
   * is slower and says what it means.
   */
  workers: 1,
  /** One retry, for a refused connection — not for a flaky assertion. */
  retries: 1,
  reporter: 'list',
  use: {baseURL: 'http://localhost:3000', trace: 'on-first-retry'},
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    /**
     * Never reuse. A leftover server serves an older build, so the suite
     * passes against code that is not the code under test — and the
     * accessibility gate reports clean on violations it never saw. With this
     * off, an occupied port is a loud error instead of a quiet wrong answer.
     */
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
