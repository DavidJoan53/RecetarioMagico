import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    // e2e/ holds Playwright specs, which import @playwright/test and cannot
    // run under Vitest. Without this they get collected and fail on import.
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['app/**', 'lib/**', 'db/**', 'components/**'],
      // The KPI we care about is per-file, not repo-average: a well-tested
      // helper should not mask an untested one. perFile makes a single
      // under-covered new file fail the run.
      thresholds: {
        perFile: true,
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
