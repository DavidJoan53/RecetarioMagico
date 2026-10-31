import {neon} from '@neondatabase/serverless'
import {drizzle} from 'drizzle-orm/neon-http'
import {env} from '@/lib/env'

/**
 * Neon over HTTP rather than a TCP pool: route handlers run as short-lived
 * serverless invocations, so there is no long-lived process for a pool to
 * belong to. The connection string points at the pooled (-pooler) host, which
 * is what makes that safe under concurrency.
 */
export const db = drizzle(neon(env.DATABASE_URL))
