import type { Member } from "./types";

export function roleLabel(role: Member["role"], labels: Record<Member["role"], string>): string {
  return labels[role];
}
