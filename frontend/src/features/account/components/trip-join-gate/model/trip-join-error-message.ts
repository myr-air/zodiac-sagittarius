import { TripApiError } from "@/src/trip/api-client";

export function errorMessage(
  caught: unknown,
  fallback: string,
  inviteNotFoundMessage?: string,
): string {
  if (caught instanceof TripApiError) {
    if (caught.status === 404)
      return inviteNotFoundMessage ?? "This invite link is invalid or has expired.";
    if (caught.status === 401 || caught.status === 403) return fallback;
    if (caught.status === 400 || caught.code === "invalid_request") return fallback;
    if (caught.status >= 500) return fallback;
    return friendlyErrorText(caught.code, fallback);
  }
  if (caught instanceof Error) {
    if (caught.message.includes("fetch") || caught.message.includes("Failed")) return fallback;
    return fallback;
  }
  return fallback;
}

function friendlyErrorText(message: string, fallback: string): string {
  const normalized = message.trim();
  if (normalized === "404") return fallback;
  if (normalized === "401" || normalized === "403") return fallback;
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return normalized;
}
