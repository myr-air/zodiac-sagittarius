export function visibleTextParts(
  parts: readonly (string | null | undefined | false)[],
): string[] {
  return parts.filter((part): part is string => Boolean(part));
}

export function joinVisibleTextParts(
  parts: readonly (string | null | undefined | false)[],
  separator: string,
): string | null {
  const visible = visibleTextParts(parts);
  return visible.length ? visible.join(separator) : null;
}

export interface DisplayNameSource {
  displayName: string;
}

export function displayTextOrFallback(
  value: string | null | undefined,
  fallback: string,
): string {
  return value || fallback;
}

export function displayNullableTextOrFallback(
  value: string | null | undefined,
  fallback: string,
): string {
  return value ?? fallback;
}

export function displayNameOrFallback(
  source: DisplayNameSource | null | undefined,
  fallback: string,
): string {
  return source?.displayName ?? fallback;
}

export function displayNameListOrFallback(
  sources: readonly DisplayNameSource[],
  fallback: string,
): string {
  return sources.map((source) => source.displayName).join(", ") || fallback;
}
