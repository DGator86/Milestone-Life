#!/usr/bin/env node
/**
 * Verifies .env.local has the env vars the app needs (Neon + NextAuth + AI).
 * Run: npm run verify
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function parseEnv(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function main() {
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    console.error("  cp .env.example .env.local");
    console.error("  Then set DATABASE_URL and AUTH_SECRET (ANTHROPIC_API_KEY optional).");
    process.exit(1);
  }

  const env = { ...parseEnv(fs.readFileSync(envPath, "utf8")), ...process.env };
  const errors = [];
  const warnings = [];

  // DATABASE_URL — required, must be a postgres connection string.
  const dbUrl = (env.DATABASE_URL ?? "").trim();
  if (!dbUrl || dbUrl.includes("user:password@") || dbUrl.includes("ep-xxx")) {
    errors.push("DATABASE_URL is missing or still a placeholder — set your Neon connection string.");
  } else if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
    errors.push("DATABASE_URL does not look like a postgres:// connection string.");
  } else if (!/sslmode=require/.test(dbUrl)) {
    warnings.push("DATABASE_URL has no sslmode=require — Neon normally needs it.");
  }

  // AUTH_SECRET — required for NextAuth in production.
  const authSecret = (env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "").trim();
  if (!authSecret || authSecret === "your-random-secret-here") {
    errors.push("AUTH_SECRET is missing — generate one: openssl rand -base64 32");
  } else if (authSecret.length < 16) {
    warnings.push("AUTH_SECRET is short — use at least 32 bytes (openssl rand -base64 32).");
  }

  // GEMINI_API_KEY — optional; gates the AI goal wizard and chat assistant.
  const geminiKey = (env.GEMINI_API_KEY ?? "").trim();
  if (!geminiKey) {
    warnings.push("GEMINI_API_KEY is not set — the AI assistant will be disabled (everything else works).");
  }

  // ANTHROPIC_API_KEY — optional; gates milestone suggestions in the manual goal form.
  const anthropicKey = (env.ANTHROPIC_API_KEY ?? "").trim();
  if (!anthropicKey) {
    warnings.push("ANTHROPIC_API_KEY is not set — milestone suggestions will use keyword fallbacks.");
  } else if (!anthropicKey.startsWith("sk-ant-")) {
    warnings.push("ANTHROPIC_API_KEY does not start with sk-ant- — double-check the key.");
  }

  for (const w of warnings) console.warn(`⚠  ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`✖  ${e}`);
    process.exit(1);
  }

  console.log("OK — required env vars are present.");
  console.log("");
  console.log("Next: npm run db:push   (apply the schema to your database)");
  console.log("Then: npm run dev       →  http://localhost:3000  →  sign up at /signup");
}

main();
