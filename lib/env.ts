import 'server-only'
import {z} from 'zod'

/** Parsed once at startup so a missing key fails by name, not as undefined. */
const envSchema = z.object({
  DATABASE_URL: z.url({protocol: /^postgresql$/}),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  AUTH_SECRET: z.string().min(32),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  /** An array, so a handler cannot compare against the raw string. */
  ALLOWED_EMAILS: z
    .string()
    .min(1)
    .transform(s =>
      s
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(z.array(z.email()).min(1)),

  /** How many past messages are sent; the rest are kept but not sent. */
  CLAUDE_CONTEXT_MESSAGES: z.coerce.number().int().min(2).default(20),
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
