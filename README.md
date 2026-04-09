# Allianz-style 1-year RILA Strategy Illustration Tool

Educational, client-facing advisor presentation app built with Next.js App Router + TypeScript.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Test

```bash
npm run test
```

## Architecture

- `app/` – Next.js entrypoint, layout, global styles, and main page orchestration.
- `components/strategy` – hero outcome, explainer visuals, education cards, advisor details drawer.
- `components/charts` – Recharts payoff visualization.
- `components/compare` – strategy compare cards/table mode.
- `components/print` – print/presentation panel.
- `lib/calculations` – isolated strategy formulas and outcome engine.
- `lib/strategyConfigs` – reusable strategy configuration objects (labels, defaults, formulas, explainers).
- `lib/scenarioPresets` – one-click market scenario buttons.
- `lib/formatters` – display format helpers.
- `types/` – shared strategy and input types.

## Editing strategy assumptions

1. Open `lib/strategyConfigs/index.ts`.
2. Update each strategy's `defaults` values (`buffer`, `cap`, `triggerRate`, `participationRate`, `floor`).
3. Optionally revise `formulaSummary`, `description`, and `explainer` copy.
4. For formula behavior changes, edit `lib/calculations/strategies.ts` and update tests in `lib/calculations/__tests__/strategies.test.ts`.

## Notes

- This tool is educational and **not** an official carrier illustration or quoting engine.
- All terms are advisor-editable in the UI for meeting use.
