#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ name: string; args: string[] }[]} */
const DEFAULT_STEPS = [
  { name: "prisma:generate", args: ["run", "prisma:generate"] },
  { name: "prisma:validate", args: ["run", "prisma:validate"] },
  { name: "typecheck", args: ["run", "typecheck"] },
  { name: "lint", args: ["run", "lint"] },
  { name: "test", args: ["run", "test"] },
  { name: "build", args: ["run", "build"] },
];

/**
 * @param {{ name: string; args: string[] }} step
 * @param {NodeJS.ProcessEnv} env
 * @returns {Promise<number>}
 */
function runStep(step, env) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", step.args, {
      cwd: root,
      stdio: "inherit",
      env,
      shell: false,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) resolve(1);
      else resolve(code ?? 1);
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const integration = argv.includes("--integration");
  const e2e = argv.includes("--e2e");

  /** @type {{ name: string; args: string[] }[]} */
  const steps = [...DEFAULT_STEPS];
  if (e2e) {
    steps.push({ name: "e2e", args: ["run", "test:e2e"] });
  }

  console.log(`verify: running ${steps.map((s) => s.name).join(" → ")}`);

  for (const step of steps) {
    let env = process.env;
    if (step.name === "test" && integration) {
      env = { ...process.env, RUN_INTEGRATION: "1" };
    }

    const code = await runStep(step, env);
    if (code !== 0) {
      console.error(`verify: failed at ${step.name} (exit ${code})`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
