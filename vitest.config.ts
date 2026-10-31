import {fileURLToPath} from 'node:url'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      /** `server-only` throws outside Next; stub it so server modules import. */
      'server-only': fileURLToPath(
        new URL('./test/empty-module.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    /** Playwright specs cannot run under Vitest. */
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      /** Logic a unit test can reach. Routes and pages are covered by e2e. */
      include: ['lib/**', 'components/**', 'db/seed-data.ts'],
      exclude: [
        /** Validates process.env at import; every test importing it runs it. */
        'lib/env.ts',
        '**/__tests__/**',
      ],
      /** Per-file, so a covered helper cannot mask an uncovered one. */
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
