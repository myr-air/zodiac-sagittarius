export function safeExternalHref(value: string | null | undefined): string {
  return parseSafeExternalUrl(value)?.toString() ?? "";
}

export function safeExternalHost(value: string | null | undefined): string | null {
  return parseSafeExternalUrl(value)?.host ?? null;
}

function parseSafeExternalUrl(value: string | null | undefined): URL | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname) return null;
    return parsed;
  } catch {
    return null;
  }
}
