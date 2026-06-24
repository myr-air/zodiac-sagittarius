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

export function firstDisplayTextOrFallback(
  values: readonly (string | null | undefined | false)[],
  fallback: string,
): string {
  return visibleTextParts(values)[0] ?? fallback;
}

export function firstNullableTextOrFallback(
  values: readonly (string | null | undefined)[],
  fallback: string,
): string {
  return values.find((value): value is string => value != null) ?? fallback;
}

export function displayNullableTextOrFallback(
  value: string | null | undefined,
  fallback: string,
): string {
  return value ?? fallback;
}

export function trimmedTextOrNull(value: string | null | undefined): string | null {
  return value?.trim() || null;
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
