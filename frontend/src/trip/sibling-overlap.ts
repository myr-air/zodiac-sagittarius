export type SiblingOverlapInput = {
  id: string;
  day: string;
  parentItemId: string | null;
  startTime: string;
  endTime?: string | null;
  endOffsetDays?: number | null;
};

type WindowedSibling = {
  id: string;
  start: number;
  end: number;
};

/**
 * Returns ids of same-day siblings (shared parentItemId, including both-null
 * roots) whose start/end windows intersect. Abutting windows do not count.
 */
export function findOverlappingSiblingIds(
  items: readonly SiblingOverlapInput[],
): Set<string> {
  const groups = new Map<string, WindowedSibling[]>();

  for (const item of items) {
    const window = timeWindow(item);
    if (!window) continue;

    const key = `${item.day}\0${item.parentItemId ?? ""}`;
    const group = groups.get(key);
    if (group) {
      group.push({ id: item.id, ...window });
    } else {
      groups.set(key, [{ id: item.id, ...window }]);
    }
  }

  const overlapping = new Set<string>();

  for (const siblings of groups.values()) {
    for (let i = 0; i < siblings.length; i++) {
      const a = siblings[i]!;
      for (let j = i + 1; j < siblings.length; j++) {
        const b = siblings[j]!;
        if (a.start < b.end && b.start < a.end) {
          overlapping.add(a.id);
          overlapping.add(b.id);
        }
      }
    }
  }

  return overlapping;
}

function timeWindow(
  item: SiblingOverlapInput,
): { start: number; end: number } | null {
  const start = parseTimeMinutes(item.startTime);
  if (start == null) return null;

  const endRaw = item.endTime?.trim();
  if (!endRaw) return null;

  const endMinutes = parseTimeMinutes(endRaw);
  if (endMinutes == null) return null;

  const end = endMinutes + (item.endOffsetDays ?? 0) * 24 * 60;
  if (end <= start) return null;

  return { start, end };
}

function parseTimeMinutes(value: string): number | null {
  const [hour, minute] = value.split(":");
  if (hour == null || minute == null) return null;
  const h = Number(hour);
  const m = Number(minute);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}
