export function countMatchingOptions<TKey extends string, TItem>(
  options: readonly TKey[],
  items: readonly TItem[],
  matches: (item: TItem, option: TKey) => boolean,
): Record<TKey, number> {
  const counts = Object.fromEntries(
    options.map((option) => [option, 0]),
  ) as Record<TKey, number>;

  for (const item of items) {
    for (const option of options) {
      if (matches(item, option)) counts[option] += 1;
    }
  }

  return counts;
}
