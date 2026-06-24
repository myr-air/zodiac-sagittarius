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
