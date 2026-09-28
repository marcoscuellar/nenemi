import { defineConfig } from '@playwright/test';

// The AI QA sweep: headless Chromium at phone and desktop size, against the page served
// straight from this folder (tests/ai-qa-sweep.spec.ts mocks /api and the outside world).
// No server, no keys, no network. Run with `npm run test:qa` or `npx playwright test`.
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['./tests/qa-reporter.ts']],
  use: {
    headless: true,
    // set QA_CHROMIUM to point at a specific Chromium build (e.g. /opt/pw-browsers/...); otherwise Playwright's own
    launchOptions: process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {},
    serviceWorkers: 'block', // sw.js can't be served through page routing; the offline cache isn't what this sweep checks
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
});
