import { tripInvitableRoleValues, type TripInvitableRole } from "@/src/trip/members";
import { roleLabel } from "./people-panel.copy";

export interface PeoplePanelRoleOption {
  value: TripInvitableRole;
  label: string;
}

export function peoplePanelManagedRoleLabel(
  role: TripInvitableRole,
  locale: string,
): string {
  return roleLabel(role, locale);
}

export function peoplePanelManagedRoleOptions(
  locale: string,
): PeoplePanelRoleOption[] {
  return tripInvitableRoleValues.map((value) => ({
    value,
    label: peoplePanelManagedRoleLabel(value, locale),
  }));
}
