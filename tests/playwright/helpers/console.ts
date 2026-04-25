import { Page } from "@playwright/test";

const ignoredPatterns = [
  /favicon\.ico/i,
  /hydration/i,
  /preloaded .* was not used/i
];

export function monitorConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignoredPatterns.some((pattern) => pattern.test(text))) return;
    errors.push(text);
  });

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  return {
    getErrors: () => errors
  };
}
