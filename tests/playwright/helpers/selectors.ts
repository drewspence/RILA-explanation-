import { Locator, Page } from "@playwright/test";

export function byTestIdOrRole(
  page: Page,
  testId: string,
  role: Parameters<Page["getByRole"]>[0],
  options?: Parameters<Page["getByRole"]>[1]
): Locator {
  const testIdMatch = page.getByTestId(testId);
  return testIdMatch.or(page.getByRole(role, options));
}

export function tab(page: Page, tabId: "overview" | "scenario" | "compare" | "print") {
  return page.getByTestId(`tab-${tabId}`);
}

export function liveScenarioValues(page: Page) {
  return {
    creditedReturn: page.getByTestId("live-credited-return"),
    endingValue: page.getByTestId("live-ending-value")
  };
}
