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
  // Parsed into an array here rather than at each call site, so a handler
  // cannot accidentally compare against the raw comma-separated string and
  // let everyone through. Lowercased because an allowlist that is case
  // sensitive fails for the one person it is supposed to admit.
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

  // How many past messages travel to the model. See db/schema for why the
  // rest are kept rather than deleted.
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
