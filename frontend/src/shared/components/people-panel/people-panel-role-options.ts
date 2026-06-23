import { tripInvitableRoleValues, type TripInvitableRole } from "@/src/trip/members";

export interface PeoplePanelRoleOption {
  value: TripInvitableRole;
  label: string;
}

export function peoplePanelManagedRoleLabel(
  role: TripInvitableRole,
  locale: string,
): string {
  if (locale === "th") {
    if (role === "organizer") return "ผู้จัดทริป";
    if (role === "traveler") return "ผู้ร่วมเดินทาง";
    return "ผู้ชม";
  }
  if (role === "organizer") return "Organizer";
  if (role === "traveler") return "Traveler";
  return "Viewer";
}

export function peoplePanelManagedRoleOptions(
  locale: string,
): PeoplePanelRoleOption[] {
  return tripInvitableRoleValues.map((value) => ({
    value,
    label: peoplePanelManagedRoleLabel(value, locale),
  }));
}
