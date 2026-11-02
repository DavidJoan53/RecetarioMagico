import {existsSync} from 'node:fs'
import {defineConfig} from 'drizzle-kit'

// drizzle-kit runs outside Next, so it reads .env.local itself rather than
// going through lib/env (which imports server-only and would throw here).
// Guarded: loadEnvFile throws on a missing file, and CI has none — its
// values come from the workflow environment.
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {url: process.env.DATABASE_URL as string},
})
