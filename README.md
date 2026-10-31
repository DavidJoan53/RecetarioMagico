# Recetario Mágico

A personal recipe manager: store recipes, label them, find them fast, and track
which one was cooked on which day. UI in Spanish, with English as a second
locale.

Originally a React Native app; migrated to Next.js in October 2026. The
reasoning, and what the move gave up, is in [MIGRATION.md](./MIGRATION.md).

> **Status: migration in progress.** The app currently renders a placeholder
> page. That is expected — the sections below mark what is wired up and what is
> still coming, so you can tell a missing feature from a broken setup.

## Running it

Needs **Node 22** (`.nvmrc` pins the exact version — `nvm use` picks it up).

```bash
nvm use
npm install
npm run dev          # http://localhost:3000
```

That is the whole setup today. The app now reads a validated environment, so copy `.env.example` to
`.env.local` and fill it in first — `lib/env.ts` fails fast with the names of
any missing keys. The example file lists every variable and where to get it.

### Scripts

| Command                 | What it does                                    |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Dev server on port 3000                         |
| `npm run build`         | Production build                                |
| `npm run typecheck`     | `tsc --noEmit`                                  |
| `npm run lint`          | Biome — format + lint in one pass               |
| `npm run test`          | Vitest unit tests                               |
| `npm run test:coverage` | Vitest with per-file 80% thresholds             |
| `npm run test:a11y`     | Playwright + axe — asserts zero violations      |
| `npm run check:docs`    | Fails if this README drifts from `package.json` |

## Stack

**Wired up now:** Next.js 16 (App Router) · React 19 · TypeScript 5.9 strict ·
Tailwind 4 · next-intl (Spanish default) · Drizzle over Neon Postgres with a
Zod-validated environment · Biome for lint and format · Vitest + Testing
Library · Playwright + axe.

**Installed, not yet used:** Auth.js (v5 — still beta; there is no stable v5
and v4 does not fit the App Router) · Anthropic SDK · TanStack Query.

**Not yet installed:** shadcn/ui.

The target data model is documented in [CLAUDE.md](./CLAUDE.md#data-model).

## Conventions

[CLAUDE.md](./CLAUDE.md) is the contributor guide: the commit convention
(enforced by commitlint — non-conforming messages are rejected), the
accessibility and typing standards, and the rule that tests and accessibility
ship in the same commit as the component they belong to.

Two that bite immediately if you miss them:

- **Commit messages** must be `<type>: :gitmoji: <Subject>` — e.g.
  `feat: :sparkles: Add recipe calendar view`.
- **Never commit `.env.local`.** It is gitignored; keep it that way.
