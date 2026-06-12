import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Production URL for the Milestone web app (Vercel).
 * Override locally: CAPACITOR_SERVER_URL=https://your-preview.vercel.app npx cap sync
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://your-production-domain.com";

const config: CapacitorConfig = {
  appId: "com.milestone.app",
  appName: "Milestone",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#07111F",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#07111F",
    },
  },
};

export default config;
