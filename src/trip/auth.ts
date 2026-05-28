import type { Member, Trip, TripCapability, TripJoinCredential, TripMemberAccessStatus, TripParticipantSession, TripRole } from "./types";

export const localTripJoinId = "HK-SZ-2025";
export const localTripJoinPassword = "dim-sum-run";
export const tripParticipantSessionStorageKey = "sagittarius:trip-participant-session";

const roleCapabilities: Record<TripRole, TripCapability[]> = {
  owner: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "editExpenses", "managePeople"],
  organizer: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "editExpenses", "managePeople"],
  traveler: ["viewPlan", "createSuggestion", "viewExpenses"],
  viewer: ["viewPlan"],
};

export function canTripRole(role: TripRole, capability: TripCapability): boolean {
  return roleCapabilities[role].includes(capability);
}

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
    sessionToken: `local_${trip.id}_${memberId}_${now.getTime().toString(36)}`,
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

export function hashLocalSecret(secret: string): string {
  const normalized = secret.trim();
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33) ^ normalized.charCodeAt(index);
  }
  return `local_hash_${(hash >>> 0).toString(36)}`;
}

function normalizeJoinId(joinId: string): string {
  return joinId.trim().toUpperCase();
}
