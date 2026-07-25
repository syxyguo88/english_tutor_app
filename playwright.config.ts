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

/** When unset, avoid colliding with a typical local `next dev` on 3000. Prefer `npm run test:e2e` so `scripts/run-e2e.mjs` can pick a free port. */
const e2ePort = process.env.E2E_PORT ?? "3001";
const baseURL = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    // Production server avoids dev-mode Server Action / compilation races during e2e.
    // Own dev server: `PW_REUSE_DEV_SERVER=1 npm run dev` with matching `E2E_PORT`.
    // Monorepo: clear stale frontend/.next (e.g. after `next dev`) before prod build for e2e.
    command: `rm -rf frontend/.next && npm run prisma:generate && npm run build && PORT=${e2ePort} npm run start`,
    url: baseURL,
    timeout: 300_000,
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
