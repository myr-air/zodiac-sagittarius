import type {
  CreateMemberApiRequest,
  PatchMemberApiRequest,
  UpdatePresenceApiRequest,
} from "../api-client";
import { nextTripMemberColor } from "./auth-member-palette";
import type { Member, TripMemberAccessStatus, TripRole } from "../types";

export function buildCreateMemberRequest(
  input: { displayName: string; role: Exclude<TripRole, "owner"> },
  options: { memberCount: number },
): CreateMemberApiRequest {
  return {
    displayName: input.displayName,
    role: input.role,
    color: nextTripMemberColor(options.memberCount),
  };
}

export function buildPatchMemberRoleRequest(
  role: Exclude<TripRole, "owner">,
): PatchMemberApiRequest {
  return { role };
}

export function buildPatchMemberAccessStatusRequest(
  accessStatus: TripMemberAccessStatus,
): PatchMemberApiRequest {
  return { accessStatus };
}

export function buildPatchMemberPasswordRequest(
  participantPassword: string,
): PatchMemberApiRequest {
  return { participantPassword };
}

export function buildUpdatePresenceRequest(
  presence: Member["presence"],
  options: { clientMutationId: string },
): UpdatePresenceApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    presence,
  };
}
