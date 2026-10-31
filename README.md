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

That is the whole setup today. **You do not need a database or any API key to
run the app right now** — nothing reads `process.env` yet. When that changes,
copy `.env.example` to `.env.local` and fill it in; the example file lists every
variable the app expects and where to get each one.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` — run before pushing |

## Stack

**Wired up now:** Next.js 16 (App Router) · React 19 · TypeScript 5.9 in strict
mode.

**Planned, not yet installed:** Tailwind · next-intl (the Spanish and English
translations are already in `messages/`) · Neon Postgres via Drizzle · Zod at
every boundary · Auth.js · the Anthropic SDK for recipe suggestions · Vercel
preview deployments per pull request.

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
