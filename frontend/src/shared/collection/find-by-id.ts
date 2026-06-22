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
