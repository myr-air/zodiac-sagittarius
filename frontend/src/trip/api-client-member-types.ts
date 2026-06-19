import type {
  Member,
  TripMemberAccessStatus,
  TripRole,
} from "./types";

export interface JoinInviteTokenResponse {
  token: string;
  expiresAt: string;
}

export interface CreateMemberApiRequest {
  displayName: string;
  role: Exclude<TripRole, "owner">;
  color: string;
  participantPassword?: string;
}

export interface PatchMemberApiRequest {
  displayName?: string;
  role?: Exclude<TripRole, "owner">;
  accessStatus?: TripMemberAccessStatus;
  participantPassword?: string;
}

export interface UpdatePresenceApiRequest {
  clientMutationId: string;
  presence: Member["presence"];
}
