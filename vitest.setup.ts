import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
config({ path: resolve(repoRoot, ".env") });

import "@testing-library/jest-dom/vitest";
