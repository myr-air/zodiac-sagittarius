/**
 * Default API origin for Joii client fetches.
 *
 * Prefer `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL`. When that is empty at runtime
 * (Turbopack sometimes fails to inline it) and the page is the local Joii
 * frontend on port 5180, fall back to the paired local API — never a
 * production host.
 */
export function defaultApiBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL?.trim() ?? "";
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    const isLocalHost =
      hostname === "127.0.0.1" || hostname === "localhost";
    if (isLocalHost && port === "5180") {
      return "http://127.0.0.1:5181";
    }
  }

  return "";
}
