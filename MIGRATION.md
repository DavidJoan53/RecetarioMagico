# Migrating RecetarioMagico from React Native to Next.js

**Status:** in progress · **Decided:** October 2026 · **Branch:** `migrate/nextjs`

## What this project was

A React Native 0.74.5 app (bare CLI, not Expo) for storing recipes and tracking
which one was cooked on which day. Four screens, Redux Toolkit, NativeWind,
i18next, running entirely on mock data. A companion repo,
`RecetarioMagicoBackend`, held a Node/Postgres REST API that never got past a
`users` controller.

Roughly 24 files and 750 lines — scaffolding, not a finished product. That
matters: the cost of changing direction here is low, and it will only ever go up.

## The decision

Rewrite as a **Next.js 15 App Router** application, **in this repository**, and
move the server code into route handlers in the same project.
`RecetarioMagicoBackend` is **abandoned, not migrated** — see below.

## Why

### 1. The things I want to practice are web things

I want to get better at accessibility — WCAG, semantics, keyboard behaviour — and
at performance work measured against real numbers rather than impressions. Those
are web-platform concepts with web-platform tooling: axe, Lighthouse, Core Web
Vitals.

React Native has its own accessibility API and its own performance story. They're
not worse, they're just a **different set of skills** than the ones I'm trying to
build right now. This isn't a verdict on React Native — it's that what I want to
practice and what React Native teaches aren't the same thing, and a side project
is the one place I get to pick.

### 2. Less setup standing between me and the app

Native builds carry a permanent cost: CocoaPods, Gradle, signing, simulator
toolchains, two store processes. None of it is the recipe app, and all of it is
the sort of thing that's broken when I come back after a couple of months — which,
on an evenings-and-weekends project, is most of the time.

Deploying the web version is a push.

### 3. The backend stops being a separate problem

Next.js route handlers put the API in the same repository, the same type system
and the same deployment as the UI. One repo, one pipeline, one preview
environment, and types that flow from the database schema through to component
props without a hand-maintained client in between.

That also removes a class of bug I'd otherwise have to manage — frontend and
backend disagreeing about a contract — by making the contract a shared type
instead of a document.

### 4. The Claude features fit more naturally here

The recipe suggestions need token-by-token rendering as the response arrives.
Route handlers stream out of the box; on React Native I'd be reaching for a
library to get the same thing. Minor by itself, but it pointed the same way as
everything above.

## What this gives up

The trade is real, so it's worth writing down:

- **There's no mobile app at the end of this.** A responsive web page on a phone
  isn't the same thing as a native one.
- **No offline, no push notifications, no home-screen presence** without extra
  work. A PWA gets some of it back later, if it ever matters enough.
- **The native setup gets shelved** — the font bundling, the icon work, the
  navigator. Small, but it was real.

**Native becomes an addition rather than the foundation.** I still want to build
it; it's just a nice-to-have now instead of the thing I maintain every time I
open the project. The data model and the API are being shaped so a native client
could consume them later without a rewrite, which is most of what that would
need anyway.

## What changes

| Before                                        | After                                               |
| --------------------------------------------- | --------------------------------------------------- |
| React Native 0.74.5, bare CLI                 | Next.js 15, App Router                              |
| React Navigation + a Redux `navigation` slice | App Router — routing state lives in the URL         |
| Redux Toolkit for server state                | TanStack Query                                      |
| NativeWind                                    | Tailwind + shadcn/ui                                |
| i18next                                       | next-intl (Spanish default, unchanged)              |
| Mock data in `*.mocks.ts`                     | Neon Postgres via Drizzle                           |
| `RecetarioMagicoBackend` (separate repo)      | Route handlers in `app/api/`                        |
| No deployment                                 | Vercel, preview deploy per pull request             |
| Jest                                          | Vitest + Testing Library, Playwright for end-to-end |

## How the migration is being done

**In place, on a branch of this repository** — never as a fresh project. The
history here is the record of how the app got to where it is, and starting over
would throw that away for no benefit.

The original plan was to keep both stacks in the tree and convert screen by
screen, deleting the React Native configuration last. **That didn't survive
contact with the toolchains.** React Native 0.74 pins React 18 and Next.js 16
needs React 19, so one `node_modules` can't hold both; and a leftover
`babel.config.js` made Next silently switch off SWC and then fail looking for a
preset that was no longer installed. The two stacks compete for the same config
filenames, so the gradual path was buying nothing and costing a lot.

So the React Native implementation was removed in a single commit and the
Next.js app built in its place. That is still a migration rather than a fresh
start — the repository, its history, and its commit conventions are unchanged,
and every deleted file is one commit away via `git show`. A reader following the
history sees the app it was, the decision, and the app it became.

Accessibility and tests are written **as each piece is ported**, not collected
into a cleanup pass at the end. The reasoning is in `CLAUDE.md` under _How work
lands_; the short version is that a single large "make it accessible" commit is
unreviewable, and by the time you write it the problem has grown.

## On `RecetarioMagicoBackend`

Archived, not migrated. It contained two commits from June 2024 — a project init
and a `users` controller — and never got further. Nothing in it relates to
recipes, so there was nothing to carry across, and route handlers make a second
service unnecessary. Keeping an empty repository alive would only create
ambiguity about where the server code lives.

The answer is: **here**, in `app/api/`.
