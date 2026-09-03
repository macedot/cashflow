<h1 align="center">Cashflow Simulator</h1>

<p align="center"><strong>Client-side cashflow forecasting and visualization</strong></p>

<p align="center">
  <img src="https://img.shields.io/github/license/macedot/cashflow?color=blue" alt="License" />
  <img src="https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vue.js&logoColor=white" alt="Vue.js" />
  <img src="https://img.shields.io/badge/Chart.js-4.5-FF6384?logo=chart.js&logoColor=white" alt="Chart.js" />
</p>

---

**Cashflow Simulator** is a zero-backend, client-side SPA that lets you model recurring income and expenses over time. Add events with any frequency (daily through annual), set a date range, and instantly see daily cashflows and running balance in an interactive chart. All data stays in your browser — no signup, no server.

## Features

- **Recurring events** — daily, weekly, monthly, quarterly, semi-annual, annual frequencies
- **Interactive chart** — bar chart for daily cashflows + stepped line for running balance
- **Multi-currency** — USD, EUR, GBP, BRL support with per-event currency and portfolio currency
- **Fullscreen chart** — expand to full screen with ESC to exit
- **Inline editing** — click any row to edit; add events with the "+" row
- **CSV import** — bulk import events with automatic date range expansion
- **CSV export** — download events or filtered results
- **localStorage persistence** — events and settings survive page reloads
- **Dark mode** — follows OS preference, toggle in header
- **Period presets** — 1 month, 3 months, 6 months, 1 year, custom
- **Zero backend** — all simulation runs in the browser; no data leaves your machine

## Quick Start

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080). ES modules require HTTP — opening `index.html` from the filesystem will not work.

## Configuration

No environment variables required for the app itself — all configuration is in the UI.

| Setting            | Default  | Description                           |
| ------------------ | -------- | ------------------------------------- |
| Initial balance    | `0`      | Starting balance for simulation       |
| Portfolio currency | `USD`    | Display currency (USD, EUR, GBP, BRL) |
| Period preset      | `1 year` | Default simulation date range         |

## CSV Format

Import CSV with columns: `name,startDate,endDate,frequency,value,currency`

```csv
name,startDate,endDate,frequency,value,currency
Salary,2025-01-01,2025-12-31,monthly,5000,USD
Rent,2025-01-01,2025-12-31,monthly,-1500,USD
```

The `currency` column is optional — defaults to `USD` when omitted.

## Development

### Prerequisites

- Node.js 20+
- npm
- Python 3 (for dev server)

### Local development

```bash
npm install
python3 -m http.server 8080
# Open http://localhost:8080
```

### Testing

```bash
npm test              # Vitest unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage (thresholds: 80%)
npm run test:e2e      # Playwright E2E tests
npm run lint          # ESLint
npm run typecheck     # TypeScript strict mode (JSDoc types)
```

## Architecture

```
┌──────────────────────────────────────────────┐
│ Browser                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ index.html (Vue 3 SPA, ~1300 lines)      │ │
│ │ ┌───────────────┐  ┌─────────────────┐   │ │
│ │ │ Events Table  │  │ Chart.js        │   │ │
│ │ │ (inline CRUD) │  │ Bar + Line      │   │ │
│ │ └───────────────┘  └─────────────────┘   │ │
│ │ ┌────────────────────────────────────┐   │ │
│ │ │ src/cashflow.js                    │   │ │
│ │ │ runSimulation / event generation   │   │ │
│ │ │ Pure functions, zero dependencies  │   │ │
│ │ └────────────────────────────────────┘   │ │
│ └──────────────────────────────────────────┘ │
│ localStorage: events + settings              │
│ CDN: Vue 3, Chart.js, PapaParse, Tailwind    │
└──────────────────────────────────────────────┘
```

**How it works:**

1. **Events** — user adds income/expense events with name, dates, frequency, value, and optional currency
2. **Simulation** — `runSimulation()` generates one entry per calendar day, applying recurring event occurrences
3. **Chart** — Chart.js renders income (green bars), expenses (red bars), and balance (blue stepped line)
4. **Persistence** — events and settings saved to `localStorage` on every change
5. **Import/Export** — PapaParse handles CSV parsing; export generates CSV from current events or results
6. **Dark mode** — Tailwind 2.x CDN (no `dark:` variants) — CSS custom properties + `!important` overrides on `.dark`

## Deployment

Push to `master` → GitHub Actions runs CI → deploys to GitHub Pages ([macedot.github.io/cashflow](https://macedot.github.io/cashflow/)). The deploy artifact contains only `index.html` and `src/` — repo files such as docs, tests, and configs are not published.

The custom domain `cashflow.macedot.dev` is served separately by Cloudflare Pages from this repository.

### Security

- **Zero backend** — no server, no API, no database. All computation and storage is client-side
- **Privacy** — no analytics, no tracking, no cookies beyond localStorage for app data

## CI/CD

GitHub Actions runs lint, typecheck, unit tests, unused-dependency and duplicate-code checks on every push and PR to `master`. Merges to `master` deploy to GitHub Pages.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
