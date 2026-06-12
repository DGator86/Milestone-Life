# Milestone

> Track the path. Kill the next step.

A no-bullshit goal CRM that tracks goals as milestone paths, with a built-in
AI assistant that acts on your own data.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Neon** (serverless **Postgres**) via **Drizzle ORM**
- **NextAuth (Auth.js v5)** — email/password (Credentials), bcrypt, JWT sessions
- **Anthropic** Claude — the in-app AI agent (optional)
- **Vercel** deployment + PWA manifest

## Setup (local)

Do these **in order**:

1. **Create a Neon database** — [console.neon.tech](https://console.neon.tech) →
   New Project → copy the **pooled** connection string (it ends with
   `?sslmode=require`).

2. **Env** — copy `.env.example` to **`.env.local`** and set at least:

   ```bash
   DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
   AUTH_SECRET=...        # generate: openssl rand -base64 32
   GEMINI_API_KEY=...     # optional — enables the AI goal wizard and chat assistant
   ANTHROPIC_API_KEY=...  # optional — enables milestone suggestions in the manual goal form
   ```

3. **Install, push the schema, verify**

   ```bash
   npm install
   npm run db:push   # creates/updates all tables from db/schema.ts (idempotent)
   npm run verify    # checks .env.local has the required vars
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), **sign up at `/signup`**,
   then use the dashboard.

### First account

1. Visit `/signup` and create an account (email + password, min 6 chars).
2. You're redirected to `/dashboard`; default groups (Work, Home, Health) are
   created automatically.
3. Click **+ Goal** to create your first goal, or open the AI assistant and ask
   it to set one up for you.

## Deploy to Vercel

Only **after** local setup works:

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New** → **Project** → **Import** this repo.
3. **Environment Variables** (Production + Preview + Development), then deploy:

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `DATABASE_URL` | ✅ | Neon pooled connection string |
   | `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
   | `GEMINI_API_KEY` | optional | Enables the AI goal wizard and chat assistant |
   | `ANTHROPIC_API_KEY` | optional | Enables milestone suggestions in the manual goal form |
   | `NEXT_PUBLIC_SITE_URL` | optional | Canonical URL, e.g. `https://yourdomain.com` (falls back to `VERCEL_URL`) |

4. **Run the schema against your production Neon DB** once:

   ```bash
   DATABASE_URL="<your production Neon URL>" npm run db:push
   ```

   > **No terminal? (e.g. on mobile)** Open the **Neon Console → your project →
   > SQL Editor**, paste the contents of [`RUN_THIS.sql`](./RUN_THIS.sql), and
   > **Run**. It's idempotent (safe to re-run) and brings an existing database
   > up to date with the latest features (admin role, custom fields, flow
   > instances, shared workspaces). For a full from-scratch schema, use
   > [`scripts/launch-schema.sql`](./scripts/launch-schema.sql).

5. **Deploy** → open the production URL → sign up (production is a separate
   database from localhost).

> I can't log into your Vercel or Neon account from here — setting the env vars
> and running `db:push` against production are always your steps, but that's the
> whole list.

## App Store & Google Play launch

See **[docs/LAUNCH.md](docs/LAUNCH.md)** for the full checklist (web + Capacitor
hybrid apps). Native shells live in **`mobile/`** — they load your production
Vercel URL.

## Project Structure

```
app/            # Next.js App Router routes (incl. /api/ai for the agent)
components/     # React components (layout, dashboard, crm, ai, forms)
db/             # Drizzle schema + client (Neon)
drizzle/        # Generated SQL migrations
lib/            # Types, helpers, settings, AI agent/tools
public/         # manifest.json, icons
```
