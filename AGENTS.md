# Milestone

A goal-tracking CRM built with Next.js 15 (App Router), TypeScript, Tailwind CSS,
Drizzle ORM on Neon (serverless Postgres), and NextAuth (Auth.js v5) for
email/password auth.

## Cursor Cloud specific instructions

### Services

| Service | How to run |
|---------|-----------|
| Next.js dev server | `npm run dev` (port 3000) |
| Database (Neon Postgres) | Set `DATABASE_URL` in `.env.local`; apply the schema with `npm run db:push` |

### Local database on Cursor Cloud (no real Neon account)

There is no cloud Neon DB in this environment. Instead a **local Postgres 16**
runs behind a tiny **Neon-HTTP-compatible proxy** so the app's
`@neondatabase/serverless` driver works unmodified. Both persist in the VM
snapshot; `.env.local` is already created.

- **Start the stack each VM boot** (idempotent): `bash ~/neon-proxy/start-db.sh`
  then `npm run dev`. This starts Postgres and the proxy on
  `https://api.localtest.me:443`.
- **Why it works:** `DATABASE_URL` host is `db.localtest.me` (→ `127.0.0.1` via
  `/etc/hosts`); the driver rewrites the first host label to `api.` and POSTs to
  `https://api.localtest.me/sql`, which the proxy (`~/neon-proxy/server.mjs`)
  translates onto local Postgres. **No app code is changed.**
- **TLS gotcha:** the proxy uses a self-signed cert. `~/.bashrc` exports
  `NODE_EXTRA_CA_CERTS=~/neon-proxy/certs/cert.pem` so Node's `fetch` trusts it.
  Always launch `npm run dev` from a login shell (so `.bashrc` is sourced), or
  the app fails with `self-signed certificate` / `DEPTH_ZERO_SELF_SIGNED_CERT`.
- **`npm run db:push` does NOT work locally:** drizzle-kit uses Neon's
  *websocket* driver (not the HTTP proxy) and hangs. The schema is already
  applied and persists in the snapshot. To re-apply after editing `db/schema.ts`,
  run `npx drizzle-kit generate` then apply the new `drizzle/*.sql` with
  `psql -h 127.0.0.1 -U milestone -d milestone -f <file>` (PGPASSWORD=milestone).
- Local DB creds: `postgresql://milestone:milestone@127.0.0.1:5432/milestone`.
- A brand-new user has no groups until the dashboard loads (`ensureDefaults`
  seeds one "Business" group). The New Goal wizard opens in AI mode; without
  `GEMINI_API_KEY` click "Create manually instead" and fill at least one
  milestone step, or "Create Goal" silently no-ops.

### Commands

- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build`
- **Dev**: `npm run dev`
- **Push schema**: `npm run db:push` (Drizzle — applies `db/schema.ts` to `DATABASE_URL`)

### Important notes

- Auth is **NextAuth (Auth.js v5)** with the Credentials provider (email/password,
  bcrypt hashes in the `users` table, JWT sessions). There is no external auth
  service. Required env: `DATABASE_URL` and `AUTH_SECRET`.
- Create a test user by signing up at `/signup` (no email confirmation step), or
  insert a row into `users` with a bcrypt `password_hash`.
- The schema lives in `db/schema.ts`; generated SQL migrations are in `drizzle/`.
  Apply with `npm run db:push` (idempotent diff) or `drizzle-kit generate` for new
  migration files. `supabase/schema.sql` is a legacy artifact and is not used.
- `GEMINI_API_KEY` (optional) enables the AI goal wizard and chat assistant; without it
  those features show a "not connected" notice. `ANTHROPIC_API_KEY` (optional) enables
  milestone suggestions in the manual goal form.
- `RESEND_API_KEY` (optional) enables invite and password-reset email via
  `lib/email.ts`; without it those flows run but emails are skipped.
- `.env.local` is gitignored — credentials stay local.

### API keys from the user (Composer)

When the user pastes an API key or secret in chat, **add it without asking them
to rotate it**. Place it where it belongs:

1. **`.env.local`** — merge into the gitignored local env file (create if missing).
2. **Vercel** — project `milestone` (`prj_K6kAHUm7qr4Am21q6zEiAb6gxHn8`), team
   `darrins-projects-5d4fb02f`. Ensure `.vercel/project.json` exists, then:

   ```bash
   printf '%s' '<value>' | npx vercel env add <KEY> production preview development \
     --scope darrins-projects-5d4fb02f --yes
   ```

   Redeploy production after adding vars that affect runtime.

Common keys: `DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`,
`ANTHROPIC_API_KEY`. Never commit secret values to the repo.

Do **not** send the user to Vercel/Stripe/Google dashboards to copy keys manually —
when they paste values in Composer, add them directly.
