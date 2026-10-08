import { expect, test } from "@playwright/test";
import { monitorConsoleErrors } from "../helpers/console";
import { expectNoHorizontalOverflow } from "../helpers/uiAssertions";

test("buffer is visible immediately and scenarios explain both loss and upside", async ({
  page,
}, testInfo) => {
  const monitor = monitorConsoleErrors(page);
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Index return -18%");
  await page.screenshot({
    path: testInfo.outputPath("initial.png"),
    fullPage: true,
  });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The first losses are cushioned",
  );
  await expect(page.getByTestId("live-credited-return")).toHaveText("-8%");
  await expect(page.getByTestId("live-ending-value")).toHaveText("$92,000");
  await expect(page.getByTestId("index-ending-value")).toHaveText("$82,000");
  await expect(page.getByTestId("absorbed-dollars")).toHaveText("$10,000");
  await expect(page.getByTestId("investor-loss-dollars")).toHaveText("$8,000");
  await expect(page.getByTestId("segment-absorbed")).toBeVisible();
  await expect(page.getByTestId("segment-investor-loss")).toBeVisible();
  await page.getByRole("button", { name: "-5%", exact: true }).click();
  await expect(page.getByTestId("live-credited-return")).toHaveText("0%");
  await expect(page.getByTestId("absorbed-dollars")).toHaveText("$5,000");
  await page.getByRole("button", { name: "+25%", exact: true }).click();
  await expect(page.getByTestId("live-credited-return")).toHaveText("+15%");
  await expect(page.getByTestId("live-ending-value")).toHaveText("$115,000");
  await expect(page.getByTestId("live-scenario-explanation")).toContainText(
    "cap limits your credited return",
  );
  await expect(page.getByTestId("segment-cap-reduction")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(monitor.getErrors()).toEqual([]);
});

test("precise boundaries, keyboard slider and invalid drafts keep results honest", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("market-number").fill("-10.01");
  await expect(page.getByTestId("live-credited-return")).toHaveText("-0.01%");
  await expect(page.getByTestId("live-ending-value")).toHaveText("$99,990");
  await expect(page.getByTestId("live-scenario-explanation")).toContainText(
    "10.01%",
  );
  await page.getByTestId("market-number").fill("-10");
  await expect(page.getByTestId("live-credited-return")).toHaveText("0%");
  await page.getByTestId("market-number").fill("0");
  await expect(page.getByTestId("live-scenario-explanation")).toContainText(
    "flat",
  );
  const slider = page.getByTestId("market-slider");
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(page.getByTestId("live-index-return-value")).toHaveText(
    "+0.01%",
  );
  await page.getByRole("button", { name: /Advisor settings/ }).click();
  await page.getByLabel("Starting investment").fill("-100");
  await expect(
    page.getByRole("alert").filter({ hasText: "last valid value" }),
  ).toContainText("last valid value");
  await expect(page.getByTestId("live-ending-value")).toHaveText("$100,010");
});

test("advisor settings switch actual rules and the table uses those terms", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Advisor settings/ }).click();
  await page.getByLabel("Upside rule").selectOption("participation");
  await page.getByLabel("Participation rate").fill("150");
  await page.getByRole("button", { name: "+25%", exact: true }).click();
  await expect(page.getByTestId("live-credited-return")).toHaveText("+37.5%");
  await expect(page.getByTestId("live-scenario-explanation")).not.toContainText(
    "cap",
  );
  await page.getByLabel("Crediting period", { exact: true }).fill("6");
  await expect(page.getByTestId("live-ending-value")).toHaveText("$137,500");
  await page.getByLabel("Downside rule").selectOption("floor");
  await page.getByRole("button", { name: "-35%", exact: true }).click();
  await expect(page.getByTestId("live-credited-return")).toHaveText("-10%");
  await expect(page.getByTestId("live-scenario-explanation")).toContainText(
    "floor",
  );
  await page
    .getByRole("button", { name: "Show index -50% scenario", exact: true })
    .click();
  await expect(page.getByTestId("live-index-return-value")).toHaveText("-50%");
  await expect(page.getByTestId("live-ending-value")).toHaveText("$90,000");
  await expectNoHorizontalOverflow(page);
});

test("presentation, disclosure and independent strategy comparison remain accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Presentation view" }).click();
  await expect(
    page.getByRole("button", { name: /Advisor settings/ }),
  ).toHaveCount(0);
  await expect(page.getByTestId("market-slider")).toBeVisible();
  await expect(
    page.getByText("A RILA can lose money.", { exact: false }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Presentation view" }),
  ).toBeVisible();
  await page
    .getByText("Advisor tools · compare additional strategy structures", {
      exact: true,
    })
    .click();
  await page
    .getByLabel("Strategy B structure")
    .selectOption("performanceParticipation");
  await page.getByRole("button", { name: "+25%", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Side-by-side strategy behavior" }),
  ).toBeVisible();
  await page
    .getByText("Important considerations & assumptions", { exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "SEC Investor.gov: RILAs" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
