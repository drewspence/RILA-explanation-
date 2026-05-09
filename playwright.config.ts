import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localBaseUrl = process.env.PLAYWRIGHT_LOCAL_BASE_URL ?? "http://127.0.0.1:3000";
const baseURL = externalBaseUrl || localBaseUrl;
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "npm run dev -- --hostname 127.0.0.1 --port 3000";

export default defineConfig({
  testDir: "./tests/playwright/specs",
  fullyParallel: true,
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }]
  ],
  outputDir: "test-results/playwright",
  use: {
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: "chromium-tablet",
      use: {
        ...devices["iPad (gen 7)"],
        browserName: "chromium"
      }
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium"
      }
    }
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: webServerCommand,
        url: localBaseUrl,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe"
      }
});
