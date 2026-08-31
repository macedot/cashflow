# Cashflow Simulator Runbooks

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Local Development

```bash
# Install dependencies
npm install

# Start development server
python3 -m http.server 8080
# Open http://localhost:8080 in browser

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests (requires browser)
npm run test:e2e

# Run linter
npm run lint

# Format code
npm run format
```

## Deployment

### CDN Deployment

This is a CDN-only SPA with no build step. To deploy:

1. Push to the `master` branch on GitHub
2. Enable GitHub Pages in repository settings
3. App will be available at `https://[username].github.io/cashflow/`

### Manual Deployment

Simply host `index.html`, `src/cashflow.js`, `src/style.css`, and the `src/` directory on any static file server (Apache, Nginx, S3, Cloudflare Pages, Netlify, Vercel, etc.)

## Troubleshooting

### App doesn't load

1. Ensure you're accessing via HTTP server (not file://)
2. Check browser console for errors
3. Verify all CDN resources load (Vue, Chart.js, PapaParse, Tailwind)

### Tests fail

1. Run `npm install` to ensure dependencies are up to date
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run typecheck`

### Chart doesn't render

1. Verify Chart.js CDN loads correctly
2. Check that canvas element exists in DOM
3. Ensure simulation has valid date range and events

### CSV import/export not working

1. Verify PapaParse CDN loaded correctly
2. Check browser console for parsing errors
3. Ensure CSV format matches expected structure (name, amount, type, frequency, startDate, endDate)

## Data Storage

All data is stored in browser localStorage:

- `cashflow_events` - Saved events
- `cashflow_sim_params` - User preferences (dark mode, currency, sim range)

To clear all data: Open browser DevTools → Application → Clear storage

## Security Notes

- All personal data stays in browser localStorage
- No authentication or user accounts
- All calculations happen client-side
- No secrets or API keys are used
- Privacy-friendly analytics (Plausible) tracks pageviews and events without cookies or personal data
- Analytics data domain: cashflow.macedot.dev
