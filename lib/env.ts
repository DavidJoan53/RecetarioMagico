import 'server-only'
import {z} from 'zod'

/**
 * Every environment variable the server expects, validated once at startup.
 *
 * Parsing here rather than reading process.env at each call site means a
 * missing or malformed value fails immediately with a message naming the key,
 * instead of surfacing later as an undefined deep inside a query or an API
 * call. `.env.example` lists each of these and where to get it.
 */
const envSchema = z.object({
  DATABASE_URL: z.url({protocol: /^postgresql$/}),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  AUTH_SECRET: z.string().min(32),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  ALLOWED_EMAIL: z.email(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues
    .map(i => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(
    `Invalid environment. Copy .env.example to .env.local and fill in:\n${missing}`,
  )
}

export const env = parsed.data
