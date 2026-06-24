import type { TripRole } from "@/src/trip/types";

export const defaultCreatedMemberRole: Exclude<TripRole, "owner"> = "traveler";

export interface CreateMemberInput {
  displayName: string;
  role: Exclude<TripRole, "owner">;
}

export function buildCreateMemberInput({
  canManagePeople,
  displayName,
  role,
}: {
  canManagePeople: boolean;
  displayName: string;
  role: Exclude<TripRole, "owner">;
}): CreateMemberInput | null {
  const trimmedDisplayName = displayName.trim();
  if (!canManagePeople || !trimmedDisplayName) return null;
  return {
    displayName: trimmedDisplayName,
    role,
  };
}

export function canBuildCreateMemberInput(input: {
  canManagePeople: boolean;
  displayName: string;
  role: Exclude<TripRole, "owner">;
}): boolean {
  return buildCreateMemberInput(input) !== null;
}
