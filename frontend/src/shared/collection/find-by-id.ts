export interface IdSource {
  id: string;
}

export function findById<TItem extends IdSource>(
  items: readonly TItem[],
  itemId: string | null | undefined,
): TItem | null {
  if (!itemId) return null;
  return items.find((item) => item.id === itemId) ?? null;
}

export function mapById<TItem extends IdSource>(
  items: readonly TItem[],
): Map<string, TItem> {
  return new Map(items.map((item) => [item.id, item]));
}

export function mapValueById<TItem extends IdSource, TValue>(
  items: readonly TItem[],
  valueForItem: (item: TItem) => TValue,
): Map<string, TValue> {
  return new Map(items.map((item) => [item.id, valueForItem(item)]));
}

export function upsertById<TItem extends IdSource>(
  current: TItem[],
  next: readonly TItem[],
): TItem[] {
  if (next.length === 0) return current;
  const nextById = mapById(next);
  const merged = current.map((item) => nextById.get(item.id) ?? item);
  const currentIds = new Set(current.map((item) => item.id));
  for (const item of next) {
    if (!currentIds.has(item.id)) merged.push(item);
  }
  return merged;
}
