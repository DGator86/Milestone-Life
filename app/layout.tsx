import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { getMetadataBase } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Milestone – Track the path. Kill the next step.",
  description: "A no-bullshit goal CRM that turns vague goals into concrete milestones. Plan, track, and kill the next step — every day.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Milestone" },
  openGraph: {
    type: "website",
    siteName: "Milestone",
    title: "Milestone – Track the path. Kill the next step.",
    description: "A no-bullshit goal CRM that turns vague goals into concrete milestones.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Milestone" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Milestone – Track the path. Kill the next step.",
    description: "A no-bullshit goal CRM that turns vague goals into concrete milestones.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07111F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="bg-milestone-bg dark:bg-[#07111F] text-gray-900 dark:text-white antialiased font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
