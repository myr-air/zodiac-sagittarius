export const RECENT_STORAGE_KEY = "joii.landing.recent";
export const RECENT_MAX = 8;

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Prepend trimmed query, dedupe exact matches, cap list length. */
export function appendRecent(
  list: readonly string[],
  query: string,
  max: number = RECENT_MAX,
): string[] {
  const trimmed = query.trim();
  if (!trimmed) return list.slice(0, max);
  return [trimmed, ...list.filter((item) => item !== trimmed)].slice(0, max);
}

export function loadRecent(storage: StorageLike | null | undefined): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function saveRecent(
  storage: StorageLike | null | undefined,
  list: string[],
): void {
  if (!storage) return;
  try {
    storage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota / private mode
  }
}
