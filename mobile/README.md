# Milestone — mobile store shells (Capacitor)

Thin native wrappers that load your **production** Milestone web app in a WebView. Same codebase as Vercel; no React Native rewrite.

## Prerequisites

- Node.js 20+
- **iOS:** macOS + Xcode, **or** [Codemagic](../codemagic.yaml) (build from Windows via cloud Mac)
- **Android:** Android Studio (works on Windows)
- Production URL: **https://milestone-red.vercel.app** (override with `CAPACITOR_SERVER_URL`)

See **[docs/WINDOWS-APP-STORE.md](../docs/WINDOWS-APP-STORE.md)** for the full Windows PC walkthrough.

## Setup

```bash
cd mobile
npm install

# Defaults to https://milestone-red.vercel.app; override for previews:
export CAPACITOR_SERVER_URL=https://your-preview.vercel.app   # bash
# $env:CAPACITOR_SERVER_URL="https://your-preview.vercel.app"  # PowerShell
```

### First-time native projects

```bash
npx cap add ios
npx cap add android
npx cap sync
```

Bundle identifier is `com.dgator86.milestonelife` (set in `capacitor.config.ts`). Change it only before your first store upload — Apple treats it as permanent.

## Develop & test

```bash
export CAPACITOR_SERVER_URL=https://your-preview.vercel.app
npx cap sync
npx cap open ios      # Simulator or device
npx cap open android
```

Sign up and sign in with email/password on device. Confirm dashboard and goals work.

## Store build

### iOS

1. Xcode → Signing & Capabilities → your team
2. Product → Archive → Distribute App → App Store Connect
3. App Store Connect: screenshots, privacy URL (`/privacy`), age rating

### Android

1. Android Studio → Build → Generate Signed Bundle (AAB)
2. Play Console: upload AAB, Data safety form, content rating

## Auth notes

- Email/password auth works in WebView with cookie-based sessions.
- If you add Google/Apple OAuth later, configure a custom URL scheme and add the matching NextAuth callback URLs.

## Version bumps

Increment `version` in native projects for each store submission after changing `capacitor.config.ts` server URL or plugins:

```bash
npx cap sync
```

See [docs/LAUNCH.md](../docs/LAUNCH.md) for the full 14-day checklist.
