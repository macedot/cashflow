# AGENTS.md

Guidance for autonomous AI agents working on this codebase.

## Project Overview

CashflowSim — client-side cashflow SPA. Vue 3 + Chart.js, zero backend, all browser. Deploys to GitHub Pages on push to master.

## Development Commands

```bash
npm install              # install dev deps
npm test                 # vitest run (unit tests: src/**/*.test.js)
npm run test:watch       # vitest watch mode
npm run test:coverage    # vitest with coverage (thresholds: 80% all metrics)
npm run test:e2e         # Playwright E2E (Chromium, auto-starts :8080)
npm run test:e2e:ui      # Playwright with UI mode
npm run lint             # ESLint on src/*.js
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier on src/**/*.js
npm run typecheck        # tsc --noEmit (strict mode, JSDoc types, checkJs)
npm run knip             # unused dependency check
npm run jscpd            # duplicate code check (threshold: 3)
npm run docs             # regenerate API.md from JSDoc (jsdoc-to-markdown)
npm run release          # release-please (conventional commits)
python3 -m http.server 8080  # local dev (ES modules require HTTP, not file://)
```

**CI pipeline order** (must pass sequentially): lint → typecheck → test → knip → jscpd

## Architecture Constraints

### File Responsibilities

| File                            | Role                                                                                   | Key Rule                                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html` (~1300 lines)      | Vue 3 SPA — ALL app logic (chart rendering, events CRUD, dark mode, CSV, localStorage) | Do NOT add more logic here. Extract to `src/` when possible.                                                                                       |
| `src/cashflow.js`               | Pure simulation engine. Zero dependencies. Only JS built-ins.                          | Exports: `runSimulation`, `generateEventCashflows`, `parseDate`, `isValidDate`, `FREQUENCIES`. Keep pure. Throws on unparseable startDate/endDate. |
| `src/dateInput.js`              | Date input normalization — auto-fixes recognizable formats to ISO, rejects the rest.   | Exports: `normalizeDateInput`. Used by the SPA for form/CSV validation. Unit tests in `src/dateInput.test.js`.                                     |
| `src/eventSort.js`              | Events table sorting — pure comparators for the Period/Freq/Value columns.             | Exports: `sortEvents`, `nextEventSort`. Returns new arrays (never mutates). Unit tests in `src/eventSort.test.js`.                                 |
| `src/logger.js`                 | Structured logger with PII redaction.                                                  | Exports: `debug`, `info`, `warn`, `error`. Use instead of raw `console.*` in new code.                                                             |
| `src/style.css`                 | Custom CSS only — Tailwind overrides, dark mode, chart container, error messages.      | No business logic here.                                                                                                                            |
| `src/cashflow.test.js`          | Vitest unit tests (~30 tests). Runs in Node environment (no browser).                  | Add tests for all new simulation logic.                                                                                                            |
| `tests/integration/app.spec.js` | Playwright E2E test. Chromium only.                                                    | Flows that touch the full SPA go here.                                                                                                             |

### Dark Mode (Critical Gotcha)

Tailwind CDN v2.x does **NOT** support `dark:` variants. Dark mode is implemented via:

1. Inline `<script>` in `<head>` sets `.dark` class on `<html>` **before** Tailwind CSS parses
2. CSS custom properties on `:root` (light) and `.dark` (dark)
3. `!important` overrides on `html.dark` targeting every used Tailwind utility class

**Rule**: When adding a new Tailwind utility class to `index.html`, add a corresponding `html.dark .your-class { property: value !important; }` rule to `src/style.css`.

### Date Handling

All date math uses **UTC** methods to avoid timezone shifts:

- `parseDate()` uses `Date.UTC(y, m-1, d)` for YYYY-MM-DD strings
- `addPeriod()` uses `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `setUTCDate()`
- Date keys use `getUTCFullYear()-getUTCMonth()-getUTCDate()`

Do NOT use local time methods (`getFullYear`, `getMonth`, `getDate`) for simulation dates.

### TypeScript

No `.ts` files. Type checking via `tsc --noEmit` with `checkJs: true` and full strict mode. Types are expressed through JSDoc annotations (`@type`, `@param`, `@returns`, `@typedef`). Every function must have JSDoc types.

## Code Standards

- **Prettier**: `semi`, `singleQuote`, `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 100`, `arrowParens: "avoid"`
- **ESLint**: `eqeqeq: "always"`, `curly: "all"`, `no-var`, `prefer-const`, `complexity: max 10`, `max-lines: 600`, `require-await`, `no-console: warn` (allows debug/info/warn/error)
- **TODO/FIXME**: must reference an issue — `TODO(#123): description`, `FIXME(#456): description`
- **Coverage thresholds**: statements 80%, branches 80%, functions 80%, lines 80%
- **Commit style**: Conventional Commits.
- **Branches**: `feature/*`, `fix/*`, `readiness/*`
- **Pre-commit hook** (Husky): `lint-staged` runs ESLint fix + Prettier on staged `.js`; Prettier on `.json/.md/.css/.html`

## Testing

- Unit: `vitest run` (forks pool, globals on, verbose reporter, retries 2x in CI)
- E2E: `playwright test` (Chromium, fully parallel, auto-starts dev server on :8080, retries 2x in CI)
- Coverage enforced at 80% across all metrics (configured in `vitest.config.js`)
- New features require unit tests. E2E tests for new user flows.

## Release & Deploy

- `npm run release` (release-please) bumps version from conventional commits
- Push to `master` → GitHub Actions runs CI → deploys to GitHub Pages (`cashflow.macedot.dev`)

## Documentation

- [API.md](API.md) — auto-generated from JSDoc (`npm run docs`)
- [docs/architecture.md](docs/architecture.md) — system diagrams, data flow
- [docs/runbooks.md](docs/runbooks.md) — dev setup, deployment, troubleshooting, localStorage keys
- [CLAUDE.md](CLAUDE.md) — Claude Code-specific guidance (detailed Vue patterns, Chart.js setup, event editing state)
