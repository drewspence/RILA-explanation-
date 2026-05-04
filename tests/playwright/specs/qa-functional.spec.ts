import { expect, test } from "@playwright/test";
import { monitorConsoleErrors } from "../helpers/console";
import { byTestIdOrRole, liveScenarioValues, tab } from "../helpers/selectors";
import { expectNoHorizontalOverflow, expectNoVisibleOverlap, expectVisibleWithinViewport } from "../helpers/uiAssertions";

test.describe("core QA flows", () => {
  test("app loads to scenario builder and main controls are usable", async ({ page }) => {
    const consoleMonitor = monitorConsoleErrors(page);

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /structured outcome studio/i })).toBeVisible();
    await expect(tab(page, "scenario")).toBeVisible();
    await expect(tab(page, "compare")).toBeVisible();
    await expect(tab(page, "print")).toBeVisible();
    await expect(page.getByTestId("tab-overview")).toHaveCount(0);
    await expect(page.getByTestId("scenario-builder")).toBeVisible();

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

    const values = liveScenarioValues(page);
    const initialEndingValue = (await values.endingValue.textContent())?.trim();

    await page.getByRole("button", { name: /severe down/i }).click();
    await expect(values.creditedReturn).toContainText(/-/);

    await page.getByRole("button", { name: /strong up/i }).click();
    await expect(values.creditedReturn).not.toContainText(/-/);

    await page.getByTestId("market-slider").evaluate((slider) => {
      const element = slider as HTMLInputElement;
      element.value = "0.2";
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(page.getByTestId("active-scenario-card")).toContainText(/market move: 20%/i);

    await expect(values.endingValue).not.toHaveText(initialEndingValue ?? "");
  });

  test("compare flow remains interactive and responsive", async ({ page }) => {
    await page.goto("/");
    await tab(page, "compare").click();

    await expect(page.getByRole("heading", { level: 2, name: /side-by-side strategy behavior/i })).toBeVisible();

    const strategySelectors = page.getByRole("combobox");
    await expect(strategySelectors).toHaveCount(2);

    await strategySelectors.nth(1).selectOption("guard");
    await expect(page.getByText(/credited return delta/i)).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectNoVisibleOverlap(page, [
      '[data-testid="tab-scenario"]',
      '[data-testid="tab-compare"]',
      '[data-testid="tab-print"]'
    ]);
  });
});
