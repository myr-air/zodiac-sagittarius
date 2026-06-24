import { tripInvitableRoleValues, type TripInvitableRole } from "@/src/trip/members";
import { peoplePanelRoleLabel } from "./people-panel.copy";

export interface PeoplePanelRoleOption {
  value: TripInvitableRole;
  label: string;
}

export function peoplePanelManagedRoleLabel(
  role: TripInvitableRole,
  locale: string,
): string {
  return peoplePanelRoleLabel(role, locale);
}

export function peoplePanelManagedRoleOptions(
  locale: string,
): PeoplePanelRoleOption[] {
  return tripInvitableRoleValues.map((value) => ({
    value,
    label: peoplePanelManagedRoleLabel(value, locale),
  }));
}
