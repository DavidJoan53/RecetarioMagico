/**
 * Asserts the README describes the app that exists.
 *
 * Written after the README claimed seven packages that were not installed.
 * Documentation drifts silently; this makes it fail loudly instead.
 *
 * What it catches, verified by probing each case:
 *   - a package claimed in the README that is not installed
 *   - an installed package the README never mentions
 *   - a documented `npm run` script that does not exist
 *   - a link to a file that is not there
 *   - a renamed section heading this script depends on
 *
 * What it cannot catch, and why:
 *   - a package in the wrong section. "Wired up" versus "installed but not
 *     used yet" is a judgement about whether code imports it; package.json
 *     cannot distinguish the two, so neither can this.
 *   - anything that is not an npm package. shadcn/ui is a CLI that copies
 *     components in, so it never appears in the dependency list.
 *
 * It deliberately does not parse prose. An earlier version tried, and shredded
 * "Next.js 16" into "Next" and "js 16" before flagging both as unknown
 * libraries. A narrow check that is right beats a broad one that cries wolf.
 */
import {existsSync, readFileSync} from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const deps = {...pkg.dependencies, ...pkg.devDependencies}
const readme = readFileSync('README.md', 'utf8')
const problems = []

// A missing section must be an error, not an empty string. The first version
// returned '' when a heading did not match, so every check against that
// section silently passed. A verification that cannot find what it verifies is
// worse than none, because it reports success.
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
  // Closes the gap the prose parser was trying to cover: a package that gets
  // installed and never documented.
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
