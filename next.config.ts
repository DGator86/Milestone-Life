import type { NextConfig } from "next";

function serverActionAllowedOrigins(): string[] {
  const extra =
    process.env.SERVER_ACTION_ALLOWED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const hosts = new Set<string>(["localhost:3000", ...extra]);

  const railwayUrl = process.env.RAILWAY_STATIC_URL ?? process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railwayUrl) hosts.add(railwayUrl.replace(/^https?:\/\//, ""));

  for (const envVar of [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    const site = envVar?.trim();
    if (site) {
      try {
        hosts.add(new URL(site).host);
      } catch {
        // ignore invalid URL
      }
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: Array.from(
        new Set([
          ...serverActionAllowedOrigins(),
          "milestone-red.vercel.app",
          "milestone-darrins-projects-5d4fb02f.vercel.app",
        ])
      ),
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
