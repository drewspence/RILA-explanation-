# Allianz-style 1-year RILA Strategy Illustration Tool

Educational, client-facing advisor explanation app built with Next.js App Router + TypeScript.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Automated QA (Playwright)

This project includes a Playwright QA suite that validates:
- Core functionality across main flows (loading, interaction, strategy/scenario updates, chart updates).
- Console/runtime health (no major console errors during basic journeys).
- Responsive behavior (desktop/tablet/mobile Chromium projects).

### Local QA commands

```bash
# Full headless suite
npm run qa:e2e

# Headed debugging (desktop Chromium)
npm run qa:e2e:headed

# Playwright UI mode
npm run qa:e2e:ui
```

### Run against a live URL

If you want to run tests against a deployed environment instead of local localhost:

```bash
PLAYWRIGHT_BASE_URL="https://your-env.example.com" npm run qa:e2e:live
```

Notes:
- `PLAYWRIGHT_BASE_URL` disables local web server boot in Playwright config.
- CI defaults to localhost (`http://127.0.0.1:3000`) for reproducibility.

## GitHub Actions QA workflow

PR workflow: `.github/workflows/playwright-qa.yml`

On every pull request, GitHub Actions will:
1. Install dependencies (`npm ci`)
2. Install Playwright Chromium (`npx playwright install --with-deps chromium`)
3. Build the app (`npm run build`)
4. Start app server on localhost in CI (`npm run start -- --hostname 127.0.0.1 --port 3000`)
5. Run Playwright suite (`npm run qa:e2e`)
6. Upload artifacts for debugging

### Artifacts available in PR checks

From the Actions run artifacts:
- `playwright-report` (HTML report)
- `playwright-test-results` (functional test output, when produced)

A run summary is also written to `GITHUB_STEP_SUMMARY` with instructions on where to find failures.

## Existing unit/logic tests

```bash
npm run test
```

## Architecture

- `app/` – Next.js entrypoint, layout, global styles, and main page orchestration.
- `components/strategy` – hero outcome, explainer visuals, education cards, advisor details drawer.
- `components/charts` – Recharts payoff visualization.
- `components/compare` – strategy compare cards/table mode.
- `lib/calculations` – isolated strategy formulas and outcome engine.
- `lib/strategyConfigs` – reusable strategy configuration objects (labels, defaults, formulas, explainers).
- `lib/scenarioPresets` – one-click market scenario buttons.
- `lib/formatters` – display format helpers.
- `types/` – shared strategy and input types.
- `tests/playwright/` – browser QA specs plus reusable helpers.

## Editing strategy assumptions

1. Open `lib/strategyConfigs/index.ts`.
2. Update each strategy's `defaults` values (`buffer`, `cap`, `triggerRate`, `participationRate`, `floor`).
3. Optionally revise `formulaSummary`, `description`, and `explainer` copy.
4. For formula behavior changes, edit `lib/calculations/strategies.ts` and update tests in `lib/calculations/__tests__/strategies.test.ts`.

## QA assumptions in tests

To keep tests stable and avoid brittle locators, Playwright checks rely on:
- ARIA roles/labels for key controls and headings.
- Explicit `data-testid` hooks for critical app controls and live value regions.
- Main user journey centered around Scenario Builder and Compare flows.

## Notes

- This tool is educational and **not** an official carrier illustration or quoting engine.
- All terms are advisor-editable in the UI for meeting use.
