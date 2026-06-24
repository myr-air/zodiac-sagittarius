export function normalizeSearchQuery(query: string | null | undefined): string {
  return query?.trim().toLocaleLowerCase() ?? "";
}

export function textMatchesSearchQuery(
  value: string | null | undefined,
  normalizedQuery: string,
): boolean {
  return Boolean(
    value && value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function textEqualsNormalizedQuery(
  value: string | null | undefined,
  normalizedQuery: string,
): boolean {
  return Boolean(value && value.toLocaleLowerCase() === normalizedQuery);
}

export function valuesMatchSearchQuery(
  values: readonly (string | null | undefined)[],
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  return values.some((value) =>
    textMatchesSearchQuery(value, normalizedQuery),
  );
}
