import type { Member, Trip, TripCapability, TripJoinCredential, TripParticipantSession, TripRole } from "./types";

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
      if (member.id !== memberId || member.claimPasswordHash) return member;
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
  return Boolean(member.claimPasswordHash) && member.claimPasswordHash === hashLocalSecret(password.trim());
}

export function createTripParticipantSession(trip: Trip, memberId: string): TripParticipantSession {
  return {
    tripId: trip.id,
    memberId,
    sessionToken: `local_${trip.id}_${memberId}_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
}

export function findSessionMember(trip: Trip, session: TripParticipantSession | null): Member | null {
  if (!session || session.tripId !== trip.id) return null;
  return trip.members.find((member) => member.id === session.memberId) ?? null;
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
