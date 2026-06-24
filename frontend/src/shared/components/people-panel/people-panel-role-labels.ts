import { roleLabel as tripMemberRoleLabel } from "@/src/trip/members";
import type { TripRole } from "@/src/trip/types";

export type PeoplePanelRoleLabels = Record<TripRole, string>;

export function peoplePanelRoleLabel(
  role: TripRole,
  labels: PeoplePanelRoleLabels,
): string {
  return tripMemberRoleLabel(role, labels);
}
