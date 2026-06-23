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
