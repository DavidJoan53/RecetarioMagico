# Recetario Mágico

A personal recipe manager: store recipes, label them, find them fast, and track
which one was cooked on which day. UI in Spanish, with English as a second
locale.

Originally a React Native app; migrated to Next.js in October 2026. The
reasoning, and what the move gave up, is in [MIGRATION.md](./MIGRATION.md).

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind · Neon Postgres via
Drizzle · Zod at every boundary · Auth.js · Anthropic SDK for recipe
suggestions · deployed on Vercel.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

`.env.example` lists every variable the app expects and where to get it. The
filled-in `.env.local` is gitignored and must stay that way.

## Conventions

Contributor guide, including the commit convention and the standards this
project is held to, is in [CLAUDE.md](./CLAUDE.md).
