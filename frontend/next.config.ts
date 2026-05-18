import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@english-tutor/backend"],
  // Dev-only: allow RSC / _next fetches when the tab is opened as `localhost` but some
  // requests resolve as `127.0.0.1` (or vice versa). Without this, navigation can fail with
  // a client-side TypeError whose message is "network error".
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  typedRoutes: true,
};

export default nextConfig;
