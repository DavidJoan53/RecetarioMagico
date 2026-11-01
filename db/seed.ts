import {existsSync} from 'node:fs'
import {neon} from '@neondatabase/serverless'
import {eq} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/neon-http'
import {labelGroups, labels} from './schema'
import {DEFAULT_LABEL_GROUPS} from './seed-data'

/**
 * Reads .env.local directly: lib/env imports server-only and throws here.
 * Guarded — loadEnvFile throws on a missing file, and CI has none.
 */
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const db = drizzle(neon(process.env.DATABASE_URL as string))

/** Idempotent — every insert conflicts on a unique name. */
async function seed(): Promise<void> {
  let newGroups = 0
  let newLabels = 0

  for (const group of DEFAULT_LABEL_GROUPS) {
    const inserted = await db
      .insert(labelGroups)
      .values({name: group.name})
      .onConflictDoNothing()
      .returning({id: labelGroups.id})

    if (inserted[0]) newGroups++

    /** Selected unconditionally: a re-run inserts nothing but needs the id. */
    const [row] = await db
      .select({id: labelGroups.id})
      .from(labelGroups)
      .where(eq(labelGroups.name, group.name))

    if (!row) throw new Error(`could not resolve label group "${group.name}"`)

    for (const label of group.labels) {
      const added = await db
        .insert(labels)
        .values({name: label.name, color: label.color, labelGroupId: row.id})
        .onConflictDoNothing()
        .returning({id: labels.id})
      if (added[0]) newLabels++
    }
  }

  console.log(`  ${newGroups} new group(s), ${newLabels} new label(s)`)
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
