# Milestone Life — Google Play (Windows PC)

Ship **Milestone Life** on Android from a Windows PC. No Mac or Apple account required.

| Item | Value |
|------|-------|
| Production URL | https://milestone-red.vercel.app |
| Package name | `com.dgator86.milestonelife` |
| App name | Milestone Life |
| Privacy policy | https://milestone-red.vercel.app/privacy |
| Terms | https://milestone-red.vercel.app/terms |

---

## Step 1 — Install tools

1. **Node.js 20 LTS** — https://nodejs.org  
2. **Git** — https://git-scm.com/download/win  
3. **Android Studio** — https://developer.android.com/studio  
   - During setup, install **Android SDK**, **SDK Platform 35**, and an emulator (optional)

Verify in PowerShell:

```powershell
node --version
git --version
```

---

## Step 2 — Get the repo

```powershell
cd $HOME\Documents
git clone https://github.com/DGator86/Milestone-Life.git
cd Milestone-Life
git checkout Main-Branch
```

---

## Step 3 — Sync the Capacitor Android shell

```powershell
cd mobile
npm install
$env:CAPACITOR_SERVER_URL="https://milestone-red.vercel.app"
npx cap sync android
```

This points the app at your live site (signup, login, goals all run in a WebView).

---

## Step 4 — Open in Android Studio

```powershell
npx cap open android
```

Wait for **Gradle sync** to finish (first time can take several minutes).

---

## Step 5 — Run on emulator or phone

1. Plug in an Android phone with **USB debugging** enabled, or start an emulator  
2. Click the green **Run** button  
3. Test:
   - [ ] Sign up
   - [ ] Log in
   - [ ] Dashboard loads
   - [ ] Create a goal
   - [ ] Edit / complete a milestone
   - [ ] Close app → reopen → still logged in
   - [ ] Privacy and terms links work

---

## Step 6 — Create a release keystore (one time)

You need this to sign the Play Store build. **Back up the file and passwords** — if you lose them, you cannot update the app on Play Store.

In PowerShell (from `mobile\android`):

```powershell
cd android
keytool -genkeypair -v -storetype PKCS12 -keystore milestone-life-release.keystore -alias milestone-life -keyalg RSA -keysize 2048 -validity 10000
```

Answer the prompts (name, org, etc.). Remember:

- Keystore password  
- Key alias: `milestone-life`  
- Key password  

Copy the example config:

```powershell
copy keystore.properties.example keystore.properties
notepad keystore.properties
```

Fill in your passwords. `keystore.properties` is gitignored — never commit it.

**Alternative:** Android Studio → **Build → Generate Signed Bundle / APK** → create keystore in the GUI (same result).

---

## Step 7 — Build the release AAB

### Option A — Android Studio (easiest)

1. **Build → Generate Signed Bundle / APK**  
2. **Android App Bundle** → Next  
3. Choose `milestone-life-release.keystore` (or create new)  
4. **release** build variant → Finish  
5. Output: `mobile\android\app\release\app-release.aab`

### Option B — Command line

```powershell
cd mobile\android
.\gradlew.bat bundleRelease
```

Requires `keystore.properties` configured. Output: `app\build\outputs\bundle\release\app-release.aab`

---

## Step 8 — Google Play Console

1. https://play.google.com/console — pay **$25** one-time developer fee (if new account)  
2. **Create app**
   - App name: **Milestone Life**
   - Default language: English (US)
   - App or game: **App**
   - Free or paid: **Free**

3. **Dashboard** — complete required sections:

| Section | What to enter |
|---------|----------------|
| App access | All functionality available without special access (or explain if login required) |
| Ads | No ads (unless you add them later) |
| Content rating | Start questionnaire → likely Everyone / Teen |
| Target audience | 18+ or general per your content |
| News app | No |
| COVID-19 | No |
| Data safety | Email, user-generated content (goals); link privacy policy |
| Privacy policy | `https://milestone-red.vercel.app/privacy` |

4. **Release → Production** (or **Internal testing** first)  
   - **Create new release**  
   - Upload `app-release.aab`  
   - Release name: `1.0 (1)`  
   - Release notes: e.g. "Initial release — goal tracking and milestone CRM"

5. **Store listing**
   - Short description (80 chars): `Track goals as milestones. Know the next step. Kill the list.`
   - Full description: what the app does (goals, CRM, kill list)
   - Screenshots: at least 2 phone screenshots from a real device (no empty dashboards)
   - App icon: 512×512 PNG (can export from `public/icon-512.png`)

6. **Submit for review**

Review often takes from a few hours to a few days.

---

## Step 9 — Future updates

For each new Play Store version:

1. Bump in `mobile/android/app/build.gradle`:
   - `versionCode` — integer, must increase every upload (e.g. `2`, `3`)
   - `versionName` — user-visible (e.g. `"1.0.1"`)
2. `npx cap sync android` if Capacitor config changed  
3. Build new signed AAB  
4. Upload in Play Console → new release

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Gradle sync failed | Android Studio → SDK Manager → install SDK 35 |
| White screen in app | Confirm `CAPACITOR_SERVER_URL` is HTTPS production URL |
| Login does not persist | Test on production URL in Chrome first; cookies require HTTPS |
| `keystore.properties not found` | Copy `keystore.properties.example` and fill in |
| Play rejects WebView app | Ensure mobile layout looks good; privacy/terms live; no broken pages |

---

## Quick reference (copy-paste)

```powershell
git clone https://github.com/DGator86/Milestone-Life.git
cd Milestone-Life\mobile
npm install
$env:CAPACITOR_SERVER_URL="https://milestone-red.vercel.app"
npx cap sync android
npx cap open android
```

Then: Run on device → test → signed AAB → Play Console upload.
