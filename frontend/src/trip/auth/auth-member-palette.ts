import type { Member } from "../types";

export function nextTripMemberId(members: Member[], displayName: string): string {
  const slug = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "member";
  const existingIds = new Set(members.map((member) => member.id));
  let candidate = `member-${slug}`;
  let index = 2;

  while (existingIds.has(candidate)) {
    candidate = `member-${slug}-${index}`;
    index += 1;
  }

  return candidate;
}

export function nextTripMemberColor(index: number): string {
  const palette = ["#0f766e", "#2563eb", "#f97316", "#64748b", "#7c3aed", "#db2777", "#0891b2", "#ca8a04"];
  return palette[index % palette.length];
}
