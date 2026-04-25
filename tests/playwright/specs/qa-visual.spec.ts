import { expect, test, Page } from "@playwright/test";
import { tab } from "../helpers/selectors";

async function gotoScenario(page: Page) {
  await page.goto("/");
  await tab(page, "scenario").click();
}

test.describe("visual regression coverage", () => {
  test("overview default state", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("overview-default.png", { fullPage: true });
  });

  test("scenario builder default and stressed state", async ({ page }) => {
    await gotoScenario(page);
    await expect(page).toHaveScreenshot("scenario-default.png", { fullPage: true });

    await page.getByRole("button", { name: /severe down/i }).click();
    await expect(page).toHaveScreenshot("scenario-severe-down.png", { fullPage: true });
  });

  test("comparison view state", async ({ page }) => {
    await page.goto("/");
    await tab(page, "compare").click();
    await page.getByRole("combobox").nth(1).selectOption("protectionCap");
    await expect(page).toHaveScreenshot("compare-state.png", { fullPage: true });
  });
});
