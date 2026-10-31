import {neon} from '@neondatabase/serverless'
import {drizzle} from 'drizzle-orm/neon-http'
import {env} from '@/lib/env'

/** HTTP, not a pool: route handlers are short-lived invocations. */
export const db = drizzle(neon(env.DATABASE_URL))
