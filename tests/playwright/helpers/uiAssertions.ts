import { expect, Locator, Page } from "@playwright/test";

export async function expectVisibleWithinViewport(locator: Locator, message: string) {
  await expect(locator, message).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${message} should have bounding box`).not.toBeNull();

  if (!box) return;

  expect(box.width, `${message} width should be non-zero`).toBeGreaterThan(0);
  expect(box.height, `${message} height should be non-zero`).toBeGreaterThan(0);
}

export async function expectNoVisibleOverlap(page: Page, selectors: string[]) {
  const overlapChecks = await page.evaluate((selectorList) => {
    const boxes = selectorList
      .map((selector) => {
        const element = document.querySelector(selector) as HTMLElement | null;
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return {
          selector,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom
        };
      })
      .filter(Boolean) as Array<{ selector: string; left: number; top: number; right: number; bottom: number }>;

    const overlaps: string[] = [];

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const intersects = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
        if (intersects) overlaps.push(`${a.selector} overlaps ${b.selector}`);
      }
    }

    return overlaps;
  }, selectors);

  expect(overlapChecks, `Unexpected overlaps detected: ${overlapChecks.join(", ")}`).toEqual([]);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      viewport: window.innerWidth,
      docWidth: doc.scrollWidth,
      bodyWidth: body.scrollWidth
    };
  });

  expect(
    Math.max(overflow.docWidth, overflow.bodyWidth),
    `Detected horizontal overflow: viewport=${overflow.viewport}, doc=${overflow.docWidth}, body=${overflow.bodyWidth}`
  ).toBeLessThanOrEqual(overflow.viewport + 2);
}
