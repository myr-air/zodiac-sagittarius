export function safeExternalHref(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    if (!parsed.hostname) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}
