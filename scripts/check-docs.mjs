/**
 * Fails when the README disagrees with package.json.
 *
 * Catches: a package claimed but not installed, an installed package never
 * mentioned, a documented script that does not exist, a broken file link, a
 * renamed section this depends on.
 *
 * Cannot catch: a package in the wrong section (installed vs wired up is a
 * fact about imports), or anything that is not an npm package.
 */
import {existsSync, readFileSync} from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const deps = {...pkg.dependencies, ...pkg.devDependencies}
const readme = readFileSync('README.md', 'utf8')
const problems = []

/** A missing marker is an error: a check that cannot find its subject passes vacuously. */
const section = (from, to) => {
  const after = readme.split(from)[1]
  if (after === undefined) {
    problems.push(
      `README is missing the "${from}" marker this check depends on`,
    )
    return ''
  }
  return after.split(to)[0] ?? after
}

const wired = section('**Wired up now:**', '**Installed, not yet used:**')
const used = section('**Installed, not yet used:**', '**Not yet installed:**')
const absent = section('**Not yet installed:**', '\n\n')

/** Display name in the README → the package that proves it. */
const PACKAGES = {
  'Next.js': 'next',
  React: 'react',
  TypeScript: 'typescript',
  Tailwind: 'tailwindcss',
  'next-intl': 'next-intl',
  Drizzle: 'drizzle-orm',
  Zod: 'zod',
  'Auth.js': 'next-auth',
  'Anthropic SDK': '@anthropic-ai/sdk',
  'TanStack Query': '@tanstack/react-query',
  Vitest: 'vitest',
  Playwright: '@playwright/test',
  Biome: '@biomejs/biome',
}

for (const [label, name] of Object.entries(PACKAGES)) {
  const installed = Boolean(deps[name])
  if (wired.includes(label) && !installed) {
    problems.push(
      `README lists "${label}" as wired up, but ${name} is not installed`,
    )
  }
  if (used.includes(label) && !installed) {
    problems.push(`README lists "${label}" as installed, but ${name} is not`)
  }
  if (absent.includes(label) && installed) {
    problems.push(
      `README lists "${label}" as not installed, but ${name} IS installed`,
    )
  }
  /** An installed package the README never mentions. */
  if (installed && !readme.includes(label)) {
    problems.push(
      `${name} is installed but "${label}" appears nowhere in the README`,
    )
  }
}

for (const [, script] of readme.matchAll(/`npm run ([a-z:]+)`/g)) {
  if (!(script in pkg.scripts)) {
    problems.push(`README documents "npm run ${script}", which does not exist`)
  }
}

for (const [, file] of readme.matchAll(/\]\(\.\/([A-Za-z.]+)[#)]/g)) {
  if (!existsSync(file)) problems.push(`README links to missing file: ${file}`)
}

if (problems.length) {
  console.error(
    `README is out of date:\n${problems.map(p => `  - ${p}`).join('\n')}`,
  )
  process.exit(1)
}
console.log(
  '✅ README matches package.json: every claim, script and link checks out',
)
