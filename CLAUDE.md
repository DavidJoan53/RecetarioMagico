# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RecetarioMagico is a personal recipe manager: store recipes, label them, find them fast, and track which recipe was cooked on which day. UI text is in **Spanish** (English as a second locale).

> ⚠️ **Migration in progress — this branch (`migrate/nextjs`) converts the app from React Native to Next.js.**
>
> `main` is still the React Native app (0.74.5, bare CLI). On this branch the React Native implementation has been **removed in one commit** and the Next.js app is being built in its place. Keeping both stacks in the tree was tried and abandoned: React Native pins React 18 while Next needs React 19, and a leftover `babel.config.js` silently switched Next off SWC. The two toolchains fight over the same config files, so there is no useful half-state to live in.
>
> Nothing is lost by that — the React Native source is in the history, one commit back. `git show HEAD~1:path/to/file` recovers any of it.
>
> The separate `RecetarioMagicoBackend` repo is **abandoned, not migrated**. All server code lives here as Next.js route handlers.

## Target stack

| Concern      | Choice                                               |
| ------------ | ---------------------------------------------------- |
| Framework    | Next.js 16, App Router, TypeScript 5.9 **strict**    |
| Styling      | Tailwind 4 + shadcn/ui                               |
| i18n         | next-intl — Spanish default, English second          |
| Server state | TanStack Query                                       |
| Server code  | Next.js route handlers (no separate service)         |
| Database     | Neon Postgres                                        |
| ORM          | Drizzle                                              |
| Validation   | Zod                                                  |
| Auth         | Auth.js v5, single OAuth provider                    |
| AI           | Anthropic SDK (`claude-haiku-4-5`) in route handlers |
| Hosting      | Vercel — preview deployment per pull request         |
| Tests        | Vitest + Testing Library; Playwright for end-to-end  |

## Commands

Working today:

```bash
npm run dev          # Next dev server
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run lint         # Biome — formatter + linter in one pass
npm run lint:fix     # Biome, writing fixes
```

Arriving with the slices that introduce them — do not assume these exist yet:

```bash
npm test                   # Vitest
npm run test:coverage
npx playwright test        # End-to-end
npx drizzle-kit generate   # Create a migration from schema changes
npx drizzle-kit migrate    # Apply migrations
```

_(React Native commands — `npm start`, `npm run ios`, `npm run android` — remain valid on `main` until the port completes.)_

## How work lands

Standards are kept by _when_ work happens, not only by what the work is. Two rules carry most of the weight:

- **There is no "make it accessible" commit.** Semantic markup, accessible names, focus handling and AA contrast arrive in the **same commit** as the component they belong to. A commit that adds an interactive element without them is incomplete, not a draft to be finished later.
- **There is no "add the tests" commit.** A new component or helper ships with its test in the same commit.

A standalone `fix: :bug:` for accessibility is fine when it corrects something already shipped. It is not fine as the first time accessibility was considered.

Check as you go rather than batching the checking either. _(The axe tooling arrives with the Next.js scaffold — once `npm run test:a11y` exists, run it against a route before committing a change to it.)_

Why this is a rule and not a preference: one large "fix accessibility" change at the end is effectively **unreviewable**. The diff touches every file, so no individual decision can be judged in the context that motivated it, and the violation count has by then grown into a project of its own. Doing it inline keeps each diff small enough to actually review and holds the count at zero.

The same logic drives the commit-scope rule below: the history is meant to be readable as a record of decisions, which only works if each commit _is_ one decision.

## Non-negotiables

These are the standards the project is held to. Treat a change that breaks one as incomplete, not as a follow-up.

### Accessibility

Build it in from the first render — retrofitting accessibility costs several times what doing it inline does, and the target is **zero** axe violations, not few.

- **Semantic HTML before ARIA.** A `<button>` that does button things needs no `role`. Reach for ARIA only when no element expresses the intent.
- Every interactive control has an **accessible name** — visible text, `aria-label`, or a bound `<label>`. Icon-only buttons always need one.
- **Keyboard reachable and operable**: logical tab order, visible focus ring (never `outline: none` without a replacement), `Esc` closes dialogs, focus is trapped inside an open modal and restored to the trigger on close.
- **WCAG AA contrast** — 4.5:1 for body text, 3:1 for large text and UI boundaries. Check theme tokens, don't assume them.
- Images carry meaningful `alt`, or `alt=""` when purely decorative.
- Form errors are associated with their input (`aria-describedby`) and announced, not just coloured red.

### Type safety

- **TypeScript strict. No `any`, no non-null `!` to silence the checker.** If a type is genuinely unknown, use `unknown` and narrow it.
- Types flow **end to end**: Drizzle schema → inferred row types → route handler → typed client → component props. No hand-maintained duplicate interfaces that can drift from the schema.
- **Zod at every trust boundary** — request bodies, search params, environment variables, and every AI response. Parse, don't assert. `z.infer` the result rather than declaring the shape twice.

### Data access

**Nothing outside `db/` imports the database client.** Pages, components and route handlers call a named function from `db/queries/` or `db/mutations/` — never `db` itself, and never a Drizzle builder inline.

```
db/<table>/queries.ts          every read for that table
db/<table>/<verb>-<noun>.ts    one write — create-recipe.ts, log-dinner.ts
lib/<entity>.ts                pure — shaping, deriving, validating. No db import.
lib/validation/<entity>.ts     the Zod schema for a boundary
app/api/<entity>/route.ts      HTTP — withAuth, parse with Zod, call the above
```

**A folder per table holds everything that table does.** Reads live together in
`queries.ts` — `latestRecipes`, `recipeById`, `recipesPage` are projections of
the same row, usually added in the same breath and read as a set. Writes get a
file each: each one carries its own validation, conflict handling and failure
modes, and they only ever grow.

```ts
import {latestRecipes} from '@/db/recipes/queries'
import {createRecipe} from '@/db/recipes/create-recipe'
```

Three reasons it is a rule and not a preference: a query used by two screens stays one query, so a fix lands once. A pure function in `lib/` is testable without a connection string, which a query module is not. And an inline builder in a component is invisible to anyone auditing what touches the database.

- All queries go through Drizzle. No raw SQL string interpolation.
- Schema changes are made in the schema file and applied via a generated migration — never by hand-editing the database.
- Nothing environment-specific is hardcoded. Secrets and URLs come from env vars, validated by a Zod schema at startup, with every key listed in `.env.example`.

### Performance

- **Never put a video iframe in a list.** Render a static thumbnail; load the player only on interaction (a "facade" — a real `<button>` showing the thumbnail that swaps in the embed on click). One YouTube iframe pulls roughly a megabyte of JavaScript; a list of them ruins LCP and INP.
- YouTube thumbnails come from `https://i.ytimg.com/vi/<ID>/mqdefault.jpg` (320×180, no API key, no storage cost). `maxresdefault.jpg` 404s on older videos — don't depend on it.
- Always use `next/image` with explicit `width`/`height` (or `fill` inside a sized box) so images cannot shift layout.
- **The app stores no image files.** `imageUrl` holds a link; there is no upload pipeline.

### Testing

- New component and helper files ship with tests. Target **80%+ coverage on new files**, enforced in CI.
- Test behaviour through the accessible interface — query by role and name, not by test id or class. This catches accessibility regressions for free.
- At least one Playwright end-to-end flow covers the core path: create a recipe → label it → find it by label.
- **Playwright always builds; it never reuses a running server.** A leftover one serves an older build, so the suite passes against code that is not under test. If `npm run test:e2e` reports the port in use, stop whatever is on 3000 — that error is the protection working.
- **End-to-end tests get their own database, `E2E_DATABASE_URL`.** They create and delete rows. Pointed at the app's own database they edit the live app, and nothing says so — every test still passes, and the mess is found later by whoever opens the page. The suite refuses to start without it, and refuses if it matches `DATABASE_URL`.
- **A write is only proven against a real database.** Component tests mock the server action, so they prove the message renders, never that the query ran or that the schema answered the way the code assumes. The catch in `delete-ingredient` looked for the wrong SQLSTATE and its unit test passed, because the test asserted the same wrong belief.

## Data model

```
recipes            id · name · prepTimeMinutes · instructions text[] · links text[] · imageUrl? · createdAt
labelGroups        id · name
labels             id · name · color · labelGroupId → labelGroups
recipeLabels       recipeId → recipes · labelId → labels           (composite PK)
ingredients        id · name · photoUrl?
recipeIngredients  id · recipeId · ingredientId · unit ENUM · quantity?
dinners            id · eatenAt timestamptz · notes?
dinnerRecipes      dinnerId → dinners · recipeId → recipes         (composite PK)
pantry             ingredientId → ingredients · quantity · unit    (PK ingredientId)
```

Conventions:

- **IDs are uuid v7** — time-sortable, so `ORDER BY id` is chronological and no extra sequence column is needed. It is also what makes keyset pagination work without `OFFSET`.
- **`unit` enum:** `g · ml · unidad · cucharada · cucharadita · taza · pizca`. Adding a value later is a migration, so the list is deliberately a little generous.
- **`labels.color` is a free hex**, chosen by the user. Chip text colour is **computed from the colour's luminance**, never stored — black above the threshold, white below. A stored text colour can be wrong for its background; a computed one cannot. This is what keeps a free picker from being able to create a contrast failure at runtime, which would otherwise be the one place a user can break the zero-violations rule.
- `prepTimeMinutes` is an integer, never a formatted string — the app sorts and filters on it.
- `quantity` is nullable: "salt, to taste" has no number.
- Many-to-many is always a join table, never an array column — arrays can't be joined or indexed.
- `recipes.imageUrl` is derived from a YouTube link when one exists and none was set; otherwise pasted manually. There is no general link-scraping.

## Architecture

- **Routing:** App Router. One folder per route segment under `app/`. Routing state lives in the URL — there is no navigation slice (the React Native app had one; it dies with the port).
- **Server code:** route handlers under `app/api/`. Each one validates its input with Zod, calls a Drizzle query, and returns typed JSON.
- **Components:** `components/` grouped by feature. Shared primitives come from shadcn/ui and are extended rather than re-implemented.
- **One component per file**, the filename its name in kebab-case. A helper that starts out private to its parent stops being private the moment a second file wants it, and until then it is invisible to anyone grepping for the name they saw in the DOM. `_components/` and the folder it sits in already say what is private.
- **Auth:** public `GET`; `POST`/`PATCH`/`DELETE` require a session, enforced in middleware. Single-user — access is an email allowlist, not a role system.
- **AI routes:** two shapes. A **streaming** route returns tokens as they arrive for open-ended suggestions; a **structured** route asks for a schema-constrained response, parses it with Zod, and returns typed objects. Never render an unparsed model response as data.

## Branches

```
feature/fix  →  dev  →  main
                 ↑        ↑
            everything   production
            lands here   only
```

- **Every pull request targets `dev`.** No exceptions by default — `dev` is the default branch, so this is what GitHub does on its own. A PR aimed at `main` is a deliberate act and needs saying out loud.
- **`main` is only ever updated by an explicit request to deploy.** Not when a feature is finished, not when CI is green, not because `dev` has piled up. Someone decides the live site should change and says so.
- **`main` is production**, and the only thing Vercel deploys to the live site. It moves when a batch of work is ready, not on every merge.
- Every push and every pull request runs CI. Each branch also gets its own preview URL, so a change can be seen before it reaches anyone.

The point is that half-finished work can sit in `dev` without the live site changing under someone who is using it.

## Comments

Short, plain, and about the code — not about how it came to be.

- **One line wherever one line will do.** A block comment needs a reason to be a block.
- **Say what is true, not what was decided.** `// uuid v7: time-ordered` — not `// chose uuid v7 over serial because...`.
- **No history.** No "previously", "changed from", "we tried X". The commit message holds that; a comment repeating it goes stale the moment the code moves.
- **Comment the surprise, not the obvious.** A constraint the code cannot show, a non-obvious consequence, an ordering requirement. Never a restatement of the line below.
- **Delete rather than update** a comment that no longer earns its place.

```ts
// Good
/** Time-ordered, so ORDER BY id is chronological. */
// Nullable: "sal, al gusto" has no number.

// Bad
/**
 * Primary keys are uuid v7 rather than a serial, because v7 embeds a
 * timestamp in its high bits, which is what lets every "newest first" query
 * use keyset pagination instead of OFFSET, which drifts when rows arrive...
 */
```

## Language

**Code is English. Only what a user reads is Spanish.**

- File names, folder names, routes, identifiers, types, comments, commit messages: English. `app/home/`, not `app/inicio/`.
- **User-facing text never appears in a `.tsx` file.** It goes in `messages/es.json` and renders through next-intl, so adding English later is a translation file rather than a search for hardcoded strings.
- This applies to API error messages too — anything that can reach a screen.

## Conventions

- **Path aliases:** `@/*` maps to the repo root. Declared in `tsconfig.json`.
- **Tests live in `__tests__/`** beside the code they cover — `lib/__tests__/color.test.ts`, not `lib/color.test.ts`.
- **Styling:** Tailwind utilities via `className`. Theme tokens (`primary`, `secondary`, `background`, …) live in the `@theme` block in `app/globals.css` — **never hardcode a hex value or a magic spacing number**. Biome's `noTailwindRawColors` and `noTailwindArbitraryValue` enforce this, so a stray `text-[#FF3F4D]` fails lint rather than relying on review to catch it.
- **The brand red is not a text colour.** `--color-primary` (#FF3F4D) measures 3.06:1 on the background — fine for accents, borders, icons and large text, below the 4.5:1 bar for body text. Use `--color-primary-strong` (#DB3642, 4.53:1 behind white) for buttons, badges, and anything carrying normal-size text.
- **User-facing text:** never hardcode strings. Add the key to **both** `messages/es.json` and `messages/en.json` (keep them in sync) and render through next-intl. Recipe content itself is data, not translation keys.
- **Formatting and linting:** **Biome** owns both, in one pass — 2-space indent, no semicolons, single quotes, trailing commas, no bracket spacing, 80 columns. There is no Prettier and no ESLint; one tool means there is nothing to keep in sync. Matches GoM-Frontend and plp-platform-frontend, which both run Biome. `lint-staged` runs it on staged files via the husky `pre-commit` hook, so formatting never reaches a commit.
- Components type their props with a local `interface` and export `default`.

## Commit convention

Commit titles **must** follow `<type>: :gitmoji: <Subject>` — e.g. `feat: :sparkles: Add recipe calendar view`. Enforced by a husky `commit-msg` hook running commitlint (`commitlint.config.js`); non-conforming commits are rejected. The hook installs via the `prepare` npm script.

`<type>` must be a conventional type and the subject must start with a gitmoji shortcode. Subject case is intentionally **not** enforced.

| type       | gitmoji                 | for                                       |
| ---------- | ----------------------- | ----------------------------------------- |
| `feat`     | `:sparkles:`            | a new feature                             |
| `fix`      | `:bug:`                 | a bug fix                                 |
| `docs`     | `:memo:`                | documentation only                        |
| `style`    | `:art:`                 | formatting / code style (no logic change) |
| `refactor` | `:recycle:`             | code change that isn't a feature or fix   |
| `perf`     | `:zap:`                 | performance                               |
| `test`     | `:white_check_mark:`    | tests                                     |
| `build`    | `:package:`             | build system / dependencies               |
| `ci`       | `:construction_worker:` | CI config                                 |
| `chore`    | `:wrench:`              | tooling / misc maintenance                |
| `revert`   | `:rewind:`              | reverting a previous commit               |

### Commit scope and message body

Commits are the project's running documentation — favour **many small, self-contained commits** over large mixed ones.

- **One concern per commit.** A dependency bump, a component port and a styling tweak are three commits, not one. If the subject needs an "and", split it.
- A commit should leave the tree in a working state.
- **The body explains _why_, not _what_** — the diff already shows what changed. Record the reason, the alternative rejected, and anything a reader six months out would find surprising. Prefer a short body on most commits over a perfect one on a few.
