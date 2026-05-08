import { defineConfig, devices } from "@playwright/test";

// System HTTP(S) proxies sometimes respond to 127.0.0.1 with 4xx; Playwright then skips webServer
// and errors "port already used". Always bypass proxy for loopback when running tests.
for (const key of ["NO_PROXY", "no_proxy"] as const) {
  const add = "127.0.0.1,localhost";
  const cur = process.env[key]?.trim();
  if (!cur) {
    process.env[key] = add;
    continue;
  }
  const parts = cur.split(",").map((h) => h.trim());
  const hasLoopback = parts.some((h) => h === "127.0.0.1" || h === "localhost");
  if (!hasLoopback) {
    process.env[key] = `${add},${cur}`;
  }
}

/** When 3000 is taken (stray `next dev`), run: `E2E_PORT=3001 npm run test:e2e` */
const e2ePort = process.env.E2E_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    // Regenerate client so Exercise schema fields match DB migrations before booting Next.
    command: `npm run prisma:generate && PORT=${e2ePort} npm run dev`,
    url: baseURL,
    // Default false: a long-lived dev server may still load an outdated @prisma/client (breaks /child/today).
    // To attach to your own server: PW_REUSE_DEV_SERVER=1 npm run test:e2e
    reuseExistingServer: process.env.PW_REUSE_DEV_SERVER === "1",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
