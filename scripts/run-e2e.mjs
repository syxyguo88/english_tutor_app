#!/usr/bin/env node
/**
 * Picks a free loopback port when E2E_PORT is unset so Playwright's webServer
 * does not collide with a local `next dev` on 3000/3001.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : null;
      server.close(() => {
        if (port != null) resolve(port);
        else reject(new Error("Could not allocate port"));
      });
    });
  });
}

/** @param {number} port */
function isPortBusy(port) {
  return new Promise((resolve) => {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      resolve(true);
      return;
    }
    const probe = createServer();
    probe.once("error", (err) => {
      const code = /** @type {NodeJS.ErrnoException} */ (err).code;
      resolve(code === "EADDRINUSE");
    });
    probe.listen(port, "127.0.0.1", () => {
      probe.close(() => resolve(false));
    });
  });
}

/**
 * Proxied environments often route loopback through HTTP proxies and return 502 for local dev,
 * breaking Playwright `webServer` health checks and Chromium navigations to 127.0.0.1.
 */
function loopbackFriendlyEnv(baseEnv) {
  const env = { ...baseEnv };
  for (const key of [
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
  ]) {
    delete env[key];
  }
  const add = "127.0.0.1,localhost";
  for (const key of ["NO_PROXY", "no_proxy"]) {
    const cur = env[key]?.trim();
    if (!cur) {
      env[key] = add;
      continue;
    }
    const parts = cur.split(",").map((h) => h.trim());
    const hasLoopback = parts.some((h) => h === "127.0.0.1" || h === "localhost");
    if (!hasLoopback) {
      env[key] = `${add},${cur}`;
    }
  }
  return env;
}

async function main() {
  const ci = process.env.CI === "true";
  let port = process.env.E2E_PORT;

  if (!port) {
    port = String(await getFreePort());
  } else if (await isPortBusy(Number(port))) {
    if (ci) {
      console.error(`e2e: E2E_PORT=${port} is in use (unexpected in CI)`);
      process.exit(1);
    }
    console.warn(`e2e: E2E_PORT=${port} in use, allocating a free port`);
    port = String(await getFreePort());
  }

  process.env.E2E_PORT = port;

  const playwrightBin = join(root, "node_modules", ".bin", "playwright");
  const playwrightArgs = ["test", ...process.argv.slice(2)];

  const child = spawn(playwrightBin, playwrightArgs, {
    cwd: root,
    stdio: "inherit",
    env: loopbackFriendlyEnv(process.env),
  });

  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
