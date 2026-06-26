# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RecetarioMagico is a React Native (0.74.5, bare CLI — not Expo) + TypeScript app for managing recipes (CRUD) and tracking which recipe was cooked on which day (calendar). UI text is in **Spanish**.

The backend is a **separate repo, `RecetarioMagicoBackend`, and its API is not yet defined**. For now the app runs entirely on **mock data**. When adding features, mock the data locally rather than blocking on a backend contract: put screen-specific mocks in a colocated `<Name>.mocks.ts` (see `screens/Home/Home.mocks.ts`), type them against the relevant component interface (e.g. `FoodCardInterface`), and mark them with a `TODO` so they're easy to swap for real API calls later.

## Commands

```bash
npm start            # Start Metro bundler (keep running in its own terminal)
npm run ios          # Build & run on iOS simulator
npm run android      # Build & run on Android emulator
npm run lint         # ESLint (@react-native config)
npm test             # Jest (preset: react-native)
npx jest path/to/file.test.tsx          # Run a single test file
npx jest -t "test name"                  # Run tests matching a name
```

Native dependency changes also need `cd ios && pod install`.

## Commit convention

Commit message titles **must** follow `<type>: :gitmoji: <Subject>` — e.g. `feat: :sparkles: Add recipe calendar view`. This is enforced by a husky `commit-msg` hook running commitlint (`commitlint.config.js`, extends `@commitlint/config-conventional`); non-conforming commits are rejected. The hook installs automatically via the `prepare` npm script on `npm install`.

Rules: `<type>` must be a conventional type, and the subject must start with a gitmoji shortcode (`:word:`). Subject case is intentionally **not** enforced, so a capitalized first word (e.g. `Redux setup`) is fine.

Recommended type → gitmoji map:

| type | gitmoji | for |
|------|---------|-----|
| `feat` | `:sparkles:` | a new feature |
| `fix` | `:bug:` | a bug fix |
| `docs` | `:memo:` | documentation only |
| `style` | `:art:` | formatting / code style (no logic change) |
| `refactor` | `:recycle:` | code change that isn't a feature or fix |
| `perf` | `:zap:` | performance |
| `test` | `:white_check_mark:` | tests |
| `build` | `:package:` | build system / dependencies |
| `ci` | `:construction_worker:` | CI config |
| `chore` | `:wrench:` | tooling / misc maintenance |
| `revert` | `:rewind:` | reverting a previous commit |

## Architecture

- **Entry:** `index.js` → `App.tsx`. `App.tsx` wraps everything in Redux `<Provider>` → `<NavigationContainer>` → `<Navigator>`. (Note: `App.tsx` still contains unused boilerplate `Section`/styles from the RN template — ignore it.)
- **Navigation:** `components/Navigator.tsx` defines a bottom-tab navigator with four screens — `Home`, `Calendar`, `Create`, `Settings`. The shared `SearchBar` is injected as the tab `headerTitle`.
- **Screens:** one folder per screen under `screens/<Name>/`, each with the component (`<Name>.tsx`) and a barrel `index.ts` (`export { default } from './<Name>'`) so imports stay `@/screens/<Name>`. Screen-specific mock data is colocated as `<Name>.mocks.ts` in the same folder (see `screens/Home/`).
- **State:** Redux Toolkit. Store in `redux/store.ts`; slices in `redux/slices/`. The `navigation` slice currently holds **UI state** (e.g. `isNewGroupOpen` modal flag), not route state. Each slice exports its actions and its `select*` selectors from the same file. `RootState`/`AppDispatch` types come from `redux/store.ts`.
- **Components:** `components/` holds reusable UI grouped by feature folder (`Groups/`, `FoodCardsCarrousel/`, `Shared/`). Modals follow the pattern in `components/Shared/Modal.tsx` (generic) wrapped by a feature modal like `Groups/NewGroupModal.tsx`, which reads/writes its open state via the Redux `navigation` slice.
- **i18n:** i18next + react-i18next. Config and translations live in `i18n/` (`index.ts` initializes i18next; `locales/es.json` + `locales/en.json`). It's initialized as a side-effect import (`import '@/i18n'`) at the top of `App.tsx` — keep that import before anything that calls `useTranslation`. Default and fallback language is **Spanish** (`es`); there is no device-locale detection (static default).

## Conventions

- **Path aliases:** `@/*` maps to the repo root (e.g. `@/redux/store`, `@/screens/Home`, `@/utils/colors`). Aliases are declared in **both** `tsconfig.json` (for the type checker) and `babel.config.js` via `babel-plugin-module-resolver` (for the bundler) — **keep them in sync** or imports break at runtime.
- **Styling:** NativeWind (Tailwind for RN). Use `className="..."` for utility styling. Theme tokens (`primary`, `secondary`, `background`, etc.) are defined in `tailwind.config.js`. When you need a color value inside a JS `StyleSheet` object instead of a class, import `tailwindColors` from `@/utils/colors` (it resolves the tailwind config) — don't hardcode hex values.
- **Icons:** FontAwesome via `@fortawesome/react-native-fontawesome`; import icons from `@fortawesome/free-solid-svg-icons`.
- **User-facing text:** never hardcode strings. Add a key to **both** `i18n/locales/es.json` and `en.json` (keep them in sync) and render via `const {t} = useTranslation()` → `t('namespace.key')`. Category/section labels are keyed by a stable id (e.g. group mocks carry an `id` and render `t(\`groups.${id}\`)`); recipe/content data stays as plain strings in mocks, not i18n keys.
- **Formatting (Prettier):** 2-space indentation, no semicolons, single quotes, trailing commas, `arrowParens: avoid` (see `.prettierrc.js`). ESLint extends `@react-native` then `prettier` (eslint-config-prettier) last, so Prettier owns all style rules — run `npm run lint` / `npx prettier --write` to conform.
- Components are typed with a local `interface` for props and exported as `default`.
