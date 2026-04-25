import { expect, test } from "@playwright/test";
import { monitorConsoleErrors } from "../helpers/console";
import { byTestIdOrRole, liveScenarioValues, tab } from "../helpers/selectors";
import { expectNoHorizontalOverflow, expectNoVisibleOverlap, expectVisibleWithinViewport } from "../helpers/uiAssertions";

test.describe("core QA flows", () => {
  test("app loads and main controls are usable without major runtime errors", async ({ page }) => {
    const consoleMonitor = monitorConsoleErrors(page);

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /structured outcome studio/i })).toBeVisible();
    await expect(tab(page, "overview")).toBeVisible();
    await expect(tab(page, "scenario")).toBeVisible();
    await expect(tab(page, "compare")).toBeVisible();

    await tab(page, "scenario").click();

    const strategySelect = byTestIdOrRole(page, "strategy-select", "combobox");
    const marketSlider = page.getByTestId("market-slider");
    const payoffChart = page.getByTestId("payoff-chart");

    await expectVisibleWithinViewport(strategySelect, "strategy selector");
    await expectVisibleWithinViewport(marketSlider, "market slider");
    await expectVisibleWithinViewport(payoffChart, "payoff chart");

    await expect(consoleMonitor.getErrors(), `Console errors were captured: ${consoleMonitor.getErrors().join(" | ")}`).toEqual([]);
  });

  test("scenario presets and slider change summary values and chart annotations", async ({ page }) => {
    await page.goto("/");
    await tab(page, "scenario").click();

    const values = liveScenarioValues(page);
    const initialEndingValue = (await values.endingValue.textContent())?.trim();

    await page.getByRole("button", { name: /severe down/i }).click();
    await expect(values.creditedReturn).toContainText(/-/);

    await page.getByRole("button", { name: /up market/i }).click();
    await expect(values.creditedReturn).not.toContainText(/-/);

    await page.getByTestId("market-slider").fill("0.2");
    await expect(page.getByTestId("active-scenario-card")).toContainText(/market move: 20\.0%/i);

    await expect(values.endingValue).not.toHaveText(initialEndingValue ?? "");
  });

  test("compare flow remains interactive and responsive layout avoids obvious clipping", async ({ page }) => {
    await page.goto("/");
    await tab(page, "compare").click();

    await expect(page.getByRole("heading", { level: 2, name: /side-by-side strategy behavior/i })).toBeVisible();

    const strategySelectors = page.getByRole("combobox");
    await expect(strategySelectors).toHaveCount(2);

    await strategySelectors.nth(1).selectOption("guard");
    await expect(page.getByText(/best for this scenario/i)).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectNoVisibleOverlap(page, [
      '[data-testid="tab-overview"]',
      '[data-testid="tab-scenario"]',
      '[data-testid="tab-compare"]',
      '[data-testid="tab-print"]'
    ]);
  });
});
