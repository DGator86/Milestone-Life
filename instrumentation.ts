// Next.js server instrumentation.
//
// `onRequestError` fires for any uncaught error during a server render or route
// handler. Production runtime logs truncate long messages, so we *front-load*
// the actionable bits — the undefined property name and the first app stack
// frame — into a short, greppable line (prefix: ERRSCAN) that survives
// truncation. This lets us pinpoint render crashes (e.g. on /ai) from the logs.

export async function register() {
  // No-op: required so Next.js loads this instrumentation file.
}

export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
) {
  try {
    const e = err as { name?: string; message?: string; stack?: string };
    const message = e?.message ?? String(err);
    const prop = message.match(/reading '([^']+)'/)?.[1];
    const frame = (e?.stack ?? "")
      .split("\n")
      .map((l) => l.trim())
      .find(
        (l) =>
          l.startsWith("at ") &&
          (l.includes("app/") ||
            l.includes("lib/") ||
            l.includes("components/") ||
            l.includes("/.next/server/")) &&
          !l.includes("node_modules"),
      );
    console.error(
      `ERRSCAN path=${request?.path ?? "-"} name=${e?.name ?? "-"} prop=${prop ?? "-"} msg="${message.slice(0, 80)}" frame=${frame ?? "-"}`,
    );
  } catch {
    console.error("ERRSCAN failed to format error", err);
  }
}
