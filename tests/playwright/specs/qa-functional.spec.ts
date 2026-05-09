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
    await expect(page.getByRole("button", { name: /presentation view/i })).toHaveCount(0);
    await expect(page.getByTestId("tab-print")).toHaveCount(0);
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
      const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      valueSetter?.call(element, "0.2");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(page.getByTestId("active-scenario-card")).toContainText(/if the market return is 20%/i);
    await expect(page.getByTestId("live-index-return-value")).toHaveText("20%");
    await expect(page.getByTestId("live-performance-credit-value")).toHaveText("12%");
    await expect(page.getByTestId("live-index-bar-label")).toHaveText("20%");
    await expect(page.getByTestId("live-credit-bar-label")).toHaveText("12%");

    await expect(values.endingValue).not.toHaveText(initialEndingValue ?? "");
  });

  test("live bar chart follows the market slider and strategy calculation", async ({ page }) => {
    await page.goto("/");

    const setSlider = async (value: string) => {
      await page.getByTestId("market-slider").evaluate((slider, nextValue) => {
        const element = slider as HTMLInputElement;
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        valueSetter?.call(element, nextValue as string);
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }, value);
    };

    await setSlider("0.2");
    await expect(page.getByTestId("live-index-return-value")).toHaveText("20%");
    await expect(page.getByTestId("live-performance-credit-value")).toHaveText("12%");
    await expect(page.getByTestId("live-index-bar-label")).toHaveText("20%");
    await expect(page.getByTestId("live-credit-bar-label")).toHaveText("12%");
    const positiveIndexBarHeight = await page.getByTestId("live-index-bar").evaluate((bar) => getComputedStyle(bar).height);
    const positiveCreditBarHeight = await page.getByTestId("live-credit-bar").evaluate((bar) => getComputedStyle(bar).height);

    await setSlider("-0.1");
    await expect(page.getByTestId("live-index-return-value")).toHaveText("-10%");
    await expect(page.getByTestId("live-performance-credit-value")).toHaveText("0%");
    await expect(page.getByTestId("live-index-bar-label")).toHaveText("-10%");
    await expect(page.getByTestId("live-credit-bar-label")).toHaveText("0%");

    await setSlider("-0.25");
    await expect(page.getByTestId("live-index-return-value")).toHaveText("-25%");
    await expect(page.getByTestId("live-performance-credit-value")).toHaveText("-15%");
    await expect(page.getByTestId("live-index-bar-label")).toHaveText("-25%");
    await expect(page.getByTestId("live-credit-bar-label")).toHaveText("-15%");
    await expect(page.getByTestId("live-scenario-explanation")).toContainText(/after the 10% buffer/i);

    await expect(page.getByTestId("live-index-bar")).not.toHaveCSS("height", positiveIndexBarHeight);
    await expect(page.getByTestId("live-credit-bar")).not.toHaveCSS("height", positiveCreditBarHeight);
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
      '[data-testid="tab-compare"]'
    ]);
  });
});
