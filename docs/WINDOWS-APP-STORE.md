# Milestone Life — Windows PC launch guide

You can do **most** of the launch from a Windows PC. iOS archive/upload still needs macOS (cloud Mac or Codemagic).

Production web app: **https://milestone-red.vercel.app**

Bundle ID (iOS + Android): **`com.dgator86.milestonelife`**

---

## Already done in this repo

- Capacitor shell in `mobile/` loads the production Vercel URL
- Bundle ID `com.dgator86.milestonelife`, display name **Milestone Life**
- Android native project generated under `mobile/android/`
- `codemagic.yaml` for iOS builds without owning a Mac

---

## 1. Clone and verify (PowerShell)

```powershell
git clone https://github.com/DGator86/Milestone-Life.git
cd Milestone-Life
git checkout Main-Branch
npm install
npm run lint
npm run typecheck
npm run build
```

---

## 2. Production web app

The live site is already deployed at https://milestone-red.vercel.app.

**One manual step in Vercel (browser):** ensure the `milestone` project is connected to **`DGator86/Milestone-Life`** (not the old `Milestone` repo), production branch **`Main-Branch`**.

Env vars on Vercel (Production + Preview + Development):

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Yes — Neon pooled URL |
| `AUTH_SECRET` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Yes — `https://milestone-red.vercel.app` |

Test on production:

- `/signup`, `/login`, `/dashboard`, `/goals`, `/privacy`, `/terms`

---

## 3. Android — full path on Windows

### Install

- [Android Studio](https://developer.android.com/studio)
- Node.js 20 LTS

### Open the project

```powershell
cd Milestone-Life\mobile
npm install
$env:CAPACITOR_SERVER_URL="https://milestone-red.vercel.app"
npx cap sync android
npx cap open android
```

### In Android Studio

1. Wait for Gradle sync
2. **Build → Generate Signed Bundle / APK** → **Android App Bundle**
3. Create a keystore (save password forever)
4. Run on a device or emulator — test signup, login, goals

### Google Play Console

1. https://play.google.com/console → Create app **Milestone Life**
2. Upload the `.aab`
3. Privacy policy: `https://milestone-red.vercel.app/privacy`
4. Complete Data safety + content rating
5. Submit for review

---

## 4. iOS — from Windows via Codemagic (no Mac)

Apple does not allow building iOS on Windows locally. Use **Codemagic** with `codemagic.yaml` in this repo.

### Setup (browser, one time)

**Prerequisites:** Apple Developer Program ($99/year) enrolled.

1. **Create App Store Connect API key** (if you have not yet)
   - https://appstoreconnect.apple.com → **Users and Access** → **Integrations** → **App Store Connect API**
   - Click **+** → name: `Milestone Life ASC` → role: **App Manager** → **Generate**
   - Download the `.p8` file immediately (only shown once)
   - Note the **Issuer ID** (top of page) and **Key ID**

2. **Add key to Codemagic**
   - https://codemagic.io → **Team settings** → **Team integrations** → **Developer Portal** → **Add key**
   - **API key name:** `Milestone Life ASC` (must match `codemagic.yaml` exactly)
   - Paste Issuer ID, Key ID, upload `.p8` file → **Save**

3. **Add app in Codemagic**
   - Applications → **DGator86/Milestone-Life** → workflow **Milestone Life iOS**

4. **Start build** — signing files are created automatically (`fetch-signing-files --create`).
   You do **not** need to upload certificates or profiles manually.

**If API key name differs:** edit `integrations.app_store_connect` in `codemagic.yaml` to your exact name.

**Common errors:**

| Error | Fix |
|-------|-----|
| `integration "codemagic" does not exist` | Use your real key name, not `codemagic` |
| `No matching profiles found for bundle identifier` | Pull latest `Main-Branch` (auto-create signing is in yaml now) |
| `App Store Connect integration ... does not exist` | Add API key in Codemagic with name `Milestone Life ASC` |

### App Store Connect (browser)

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Register bundle ID: `com.dgator86.milestonelife`
3. Create app **Milestone Life**, SKU `milestone-life-ios-001`
4. After Codemagic build → build appears in TestFlight → submit for review

### Alternative: borrow a Mac for 1–2 hours

```bash
cd mobile
npm install
export CAPACITOR_SERVER_URL=https://milestone-red.vercel.app
npx cap add ios && npx cap sync && npx cap open ios
```

Xcode → Signing → Archive → Upload to App Store Connect.

---

## 5. Store listing copy (starter)

**Subtitle:** Track goals. Kill the next step.

**Description:** Milestone Life turns vague goals into concrete milestones. Plan your path, track progress, and always know the next action — on web and mobile.

**Privacy URL:** https://milestone-red.vercel.app/privacy

**Support URL:** https://milestone-red.vercel.app (or your support email page)

**Category:** Productivity

---

## What only you can do

| Task | Why |
|------|-----|
| Vercel → connect Milestone-Life repo | Dashboard Git settings |
| Apple Developer enrollment | Paid account, identity verification |
| Google Play $25 registration | Payment + identity |
| Android signing keystore password | You must store this securely |
| Codemagic Apple API keys | App Store Connect → Users and Access → Keys |
| App Store / Play screenshots | Capture from device or emulator |
