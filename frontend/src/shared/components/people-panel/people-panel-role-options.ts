import { tripInvitableRoleValues, type TripInvitableRole } from "@/src/trip/members";
import { peoplePanelRoleLabel, type PeoplePanelRoleLabels } from "./people-panel-role-labels";

export interface PeoplePanelRoleOption {
  value: TripInvitableRole;
  label: string;
}

export function peoplePanelManagedRoleLabel(
  role: TripInvitableRole,
  labels: PeoplePanelRoleLabels,
): string {
  return peoplePanelRoleLabel(role, labels);
}

export function peoplePanelManagedRoleOptions(
  labels: PeoplePanelRoleLabels,
): PeoplePanelRoleOption[] {
  return tripInvitableRoleValues.map((value) => ({
    value,
    label: peoplePanelManagedRoleLabel(value, labels),
  }));
}
