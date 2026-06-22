export function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id];
}
