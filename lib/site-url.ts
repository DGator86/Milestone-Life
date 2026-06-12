function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Canonical public site URL (no trailing slash) for metadata and absolute links.
 * Set NEXT_PUBLIC_SITE_URL in production (for example https://yourdomain.com).
 * On Vercel, https://VERCEL_URL is used when NEXT_PUBLIC_SITE_URL is unset.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}
