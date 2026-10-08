# RILA educational experience

## Information architecture and flow

1. One-sentence explanation: loss protection has a boundary and applies at the end of a term.
2. Interactive slider: -50% to +50% cumulative index price return, plus numeric entry in 0.01 percentage-point increments.
3. Loss allocation: index decline split into absorbed loss and investor loss. On rising scenarios, credited growth and the portion removed by a cap are shown separately.
4. Outcome comparison: hypothetical index exposure versus the RILA, using the same starting investment and timeframe.
5. Stress tests: clickable scenario rows, including -40% and -50% declines.
6. Tradeoff: what is protected, remaining risks, and the selected upside rule.
7. Expandable advisor comparisons and disclosures.

The initial scenario is -18%, a 10% buffer, 15% cap, 100% participation, $100,000, and a 12-month term. The visual shows $10,000 absorbed and $8,000 investor loss before asking clients to explore a positive return. Presentation mode removes settings, stress tables, and secondary sections while retaining the slider, presets, essential outcomes, and disclosures. Escape exits presentation mode.

## Visual system

Warm neutral canvas, dark ink, restrained green, generous space, proportional horizontal tracks, and large tabular numbers. Absorbed losses use green hatching; investor losses use red; index changes use navy; upside removed by a cap uses amber hatching. All meanings are also expressed in text. The shared track scale expands for participation outcomes over 50%. Zero values have zero-length segments. Width transitions obey reduced-motion preferences.

## Calculation and product architecture

`types/product.ts` defines explicit protection and upside discriminated unions, index return basis, crediting period, source metadata, and descriptive contract details. `lib/products/index.ts` supplies hypothetical defaults and adapts existing strategy definitions. Carrier-specific verified terms can supply the same model; the UI does not infer a rule from an unrelated default.

`lib/calculations/education.ts` contains validation and pure functions for buffers, caps, participation and dollar outcomes. Results expose absorbed loss, investor loss, upside before cap, cap reduction, participation adjustment, both ending values, and one shared explanation. `engine.ts` routes the legacy comparison view through this engine.

For a simple buffer and capped-participation strategy:

- Negative index return r: RILA = min(0, r + buffer).
- Non-negative index return r: RILA = min(r × participation, cap).
- Absorbed downside = max(0, -r) - max(0, -RILA).
- Ending value = investment × (1 + return).

A floor limits the negative credited return to the selected negative floor. A trigger pays its fixed rate when its condition is satisfied. Trigger gains are separate from absorbed losses. The cap is applied after positive participation in this hypothetical model. A real contract may specify different sequencing or crediting methods and requires a separately verified calculation rule.

All returns are cumulative over the selected term, not annualized. Changing the term does not compound a one-year return or infer a carrier cap. Fees, dividends, taxes, withdrawals, surrender charges, interim valuations, and renewals are not modeled.

## Components

- MarketControl: range slider, precise entry, accessible value text, presets.
- BufferVisual: shared-scale loss/growth segments, boundary marker, breakdown, explanation.
- OutcomeComparison: percentage and dollar outcomes for identical assumptions.
- AdvisorSettings: validated terms and 10/15/20/30% buffer shortcuts.
- ScenarioTable: current-term stress outcomes and scenario selection.
- NumberField: invalid drafts remain visible with inline error; the last valid model value persists.
- Disclosures: visible essential qualification and expandable source-linked details.

## Verification and acceptance

Unit regressions cover flat returns, buffer boundary, 0.01 percentage point beyond buffer, cap boundary, beyond cap, -50% and -100% declines, floors, triggers, participation, combined cap/participation, invalid input and gains above 200%. Legacy strategies retain their valid payoffs. Playwright flows cover desktop, tablet and mobile interactions, keyboard input, presentation, validation, strategy switching, disclosure and horizontal overflow.

Before merging, ask a client unfamiliar with RILAs to use the slider for 20 seconds and explain which losses reach their account, when the protection applies, and which upside rule changes their return. This usability criterion requires human review; automated tests cannot establish comprehension.

## Sources and product limits

SEC Investor.gov [RILA glossary](https://www.investor.gov/introduction-investing/investing-basics/glossary/registered-index-linked-annuity-rila) and [indexed annuities bulletin](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated-investor-bulletin-indexed-annuities) support the explanatory assumptions. This application is educational, not a recommendation or a product quote.
