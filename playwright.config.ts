import {loadEnvConfig} from '@next/env'
import {defineConfig, devices} from '@playwright/test'

/** The runner is not Next, so .env.local needs loading to mint a session. */
loadEnvConfig(process.cwd())

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
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
