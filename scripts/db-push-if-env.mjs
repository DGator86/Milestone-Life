#!/usr/bin/env node
/**
 * Apply Drizzle schema when DATABASE_URL is configured (e.g. Vercel production build).
 * Skips silently in CI or local builds without a real database URL.
 */

import { spawnSync } from "node:child_process";

const url = (process.env.DATABASE_URL ?? "").trim();
const isPlaceholder =
  !url ||
  url.includes("user:password@") ||
  url.includes("ep-xxx") ||
  !/^postgres(ql)?:\/\//.test(url);

if (isPlaceholder) {
  console.log("db-push: skipped (no DATABASE_URL)");
  process.exit(0);
}

console.log("db-push: applying schema…");
const result = spawnSync("npx", ["drizzle-kit", "push"], {
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("db-push: done");
