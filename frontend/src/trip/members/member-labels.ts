import type { Member } from "../types";

export function memberInitial(name: string): string {
  return name.trim().slice(0, 1).toLocaleUpperCase() || "?";
}

export function roleLabel(role: Member["role"], labels: Record<Member["role"], string>): string {
  return labels[role];
}
