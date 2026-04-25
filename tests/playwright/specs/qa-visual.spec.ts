import { test, Page } from "@playwright/test";
import { tab } from "../helpers/selectors";
import { expectNoHorizontalOverflow, expectVisibleWithinViewport } from "../helpers/uiAssertions";

async function gotoScenario(page: Page) {
  await page.goto("/");
  await tab(page, "scenario").click();
}

test.describe("visual regression coverage", () => {
  test("overview default state", async ({ page }) => {
    await page.goto("/");
    await expectVisibleWithinViewport(page.getByRole("heading", { level: 1, name: /structured outcome studio/i }), "overview heading");
    await expectNoHorizontalOverflow(page);
    await test.info().attach("overview-default", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png"
    });
  });

  test("scenario builder default and stressed state", async ({ page }) => {
    await gotoScenario(page);
    await expectVisibleWithinViewport(page.getByTestId("payoff-chart"), "scenario payoff chart");
    await expectNoHorizontalOverflow(page);
    await test.info().attach("scenario-default", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png"
    });

    await page.getByRole("button", { name: /severe down/i }).click();
    await test.info().attach("scenario-severe-down", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png"
    });
  });

  test("comparison view state", async ({ page }) => {
    await page.goto("/");
    await tab(page, "compare").click();
    await page.getByRole("combobox").nth(1).selectOption("protectionCap");
    await expectVisibleWithinViewport(page.getByRole("heading", { level: 2, name: /side-by-side strategy behavior/i }), "compare heading");
    await expectNoHorizontalOverflow(page);
    await test.info().attach("compare-state", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png"
    });
  });
});
