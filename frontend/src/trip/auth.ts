import type {
  CreateMemberApiRequest,
  PatchMemberApiRequest,
  UpdatePresenceApiRequest,
} from "./api-client";
import { nextTripMemberColor, nextTripMemberId } from "./auth-member-palette";
import { createLocalSessionToken, hashLocalSecret } from "./auth-local-secrets";
import type { Member, Trip, TripJoinCredential, TripMemberAccessStatus, TripParticipantSession, TripRole } from "./types";

export { canTripRole } from "./auth-capabilities";
export { seedTripJoinId, seedTripJoinPassword, tripParticipantSessionStorageKey } from "./auth-constants";
export { hashLocalSecret } from "./auth-local-secrets";
export { nextTripMemberColor } from "./auth-member-palette";

export function verifyTripCredentials(trip: Trip, credentials: TripJoinCredential): boolean {
  return normalizeJoinId(credentials.joinId) === normalizeJoinId(trip.joinId) && hashLocalSecret(credentials.password) === trip.joinPasswordHash;
}

export function claimTripParticipant(trip: Trip, memberId: string, password: string): Trip {
  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 4) return trip;

  return {
    ...trip,
    members: trip.members.map((member) => {
      if (member.id !== memberId || member.claimPasswordHash || isTripParticipantDisabled(member)) return member;
      return {
        ...member,
        claimPasswordHash: hashLocalSecret(trimmedPassword),
        claimedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        presence: "online",
      };
    }),
  };
}

export function createTripParticipant(trip: Trip, input: { displayName: string; role: Exclude<TripRole, "owner"> }): Trip {
  const displayName = input.displayName.trim();
  if (!displayName) return trip;

  return {
    ...trip,
    members: [
      ...trip.members,
      {
        id: nextTripMemberId(trip.members, displayName),
        displayName,
        role: input.role,
        presence: "offline",
        color: nextTripMemberColor(trip.members.length),
        claimPasswordHash: null,
        claimedAt: null,
        lastSeenAt: null,
        accessStatus: "active",
      },
    ],
  };
}

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

export function replaceTripParticipant(trip: Trip, member: Member): Trip {
  return {
    ...trip,
    members: trip.members.map((candidate) =>
      candidate.id === member.id ? member : candidate,
    ),
  };
}

export function appendTripParticipant(trip: Trip, member: Member): Trip {
  return {
    ...trip,
    members: [...trip.members, member],
  };
}

export function updateTripParticipantRole(trip: Trip, memberId: string, role: Exclude<TripRole, "owner">): Trip {
  return {
    ...trip,
    members: trip.members.map((member) => {
      if (member.id !== memberId || member.role === "owner") return member;
      return { ...member, role };
    }),
  };
}

export function setTripParticipantAccessStatus(trip: Trip, memberId: string, accessStatus: TripMemberAccessStatus): Trip {
  return {
    ...trip,
    members: trip.members.map((member) => {
      if (member.id !== memberId || member.role === "owner") return member;
      if (accessStatus === "active") return { ...member, accessStatus };
      return {
        ...member,
        accessStatus,
        claimPasswordHash: null,
        claimedAt: null,
        lastSeenAt: null,
        presence: "offline",
      };
    }),
  };
}

export function resetTripParticipantClaim(trip: Trip, memberId: string): Trip {
  return {
    ...trip,
    members: trip.members.map((member) =>
      member.id === memberId
        ? {
            ...member,
            claimPasswordHash: null,
            claimedAt: null,
            lastSeenAt: null,
            presence: "offline",
          }
        : member,
    ),
  };
}

export function setTripParticipantPassword(trip: Trip, memberId: string, password: string): Trip {
  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 4) return trip;
  const changedAt = new Date().toISOString();

  return {
    ...trip,
    members: trip.members.map((member) => {
      if (member.id !== memberId || isTripParticipantDisabled(member)) return member;
      return {
        ...member,
        claimPasswordHash: hashLocalSecret(trimmedPassword),
        claimedAt: member.claimedAt ?? changedAt,
        lastSeenAt: changedAt,
        presence: "online",
      };
    }),
  };
}

export function verifyTripParticipantPassword(member: Member, password: string): boolean {
  return !isTripParticipantDisabled(member) && Boolean(member.claimPasswordHash) && member.claimPasswordHash === hashLocalSecret(password.trim());
}

interface TripParticipantSessionOptions {
  now?: Date;
  rememberDays?: number;
}

export function createTripParticipantSession(trip: Trip, memberId: string, options: TripParticipantSessionOptions = {}): TripParticipantSession {
  const now = options.now ?? new Date();
  const rememberDays = options.rememberDays ?? 30;
  const expiresAt = new Date(now.getTime() + rememberDays * 24 * 60 * 60 * 1000);
  return {
    tripId: trip.id,
    memberId,
    sessionToken: createLocalSessionToken(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function findSessionMember(trip: Trip, session: TripParticipantSession | null, now = new Date()): Member | null {
  if (!session || session.tripId !== trip.id) return null;
  if (Date.parse(session.expiresAt) <= now.getTime()) return null;
  const member = trip.members.find((candidate) => candidate.id === session.memberId) ?? null;
  return member && !isTripParticipantDisabled(member) ? member : null;
}

export function isTripParticipantDisabled(member: Member): boolean {
  return member.accessStatus === "disabled";
}

export function linkTripParticipantToUser(trip: Trip, memberId: string, userId: string): Trip {
  const linkedAt = new Date().toISOString();
  return {
    ...trip,
    members: trip.members.map((member) => {
      if (member.id !== memberId || isTripParticipantDisabled(member)) return member;
      return {
        ...member,
        userId,
        claimedAt: member.claimedAt ?? linkedAt,
        lastSeenAt: linkedAt,
      };
    }),
  };
}

function normalizeJoinId(joinId: string): string {
  return joinId.trim().toUpperCase();
}
