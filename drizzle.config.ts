import {defineConfig} from 'drizzle-kit'

// drizzle-kit runs outside Next, so it reads .env.local itself rather than
// going through lib/env (which imports server-only and would throw here).
process.loadEnvFile?.('.env.local')

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {url: process.env.DATABASE_URL as string},
})
