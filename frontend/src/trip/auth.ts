import type { Member, Trip, TripCapability, TripJoinCredential, TripMemberAccessStatus, TripParticipantSession, TripRole } from "./types";

export const seedTripJoinId = "HK-SZ-2025";
export const seedTripJoinPassword = "seed-trip-pass";
export const tripParticipantSessionStorageKey = "sagittarius:trip-participant-session";

const roleCapabilities: Record<TripRole, TripCapability[]> = {
  owner: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "editExpenses", "managePeople", "manageTripPlans", "managePhotoAlbums"],
  organizer: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "editExpenses", "managePeople", "manageTripPlans", "managePhotoAlbums"],
  traveler: ["viewPlan", "editItinerary", "createSuggestion", "viewExpenses", "managePhotoAlbums"],
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

function createLocalSessionToken(): string {
  const webCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (webCrypto && "randomUUID" in webCrypto) return `local-${webCrypto.randomUUID()}`;
  const randomValue = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `local-${randomValue}`;
}

function nextTripMemberId(members: Member[], displayName: string): string {
  const slug = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "member";
  const existingIds = new Set(members.map((member) => member.id));
  let candidate = `member-${slug}`;
  let index = 2;

  while (existingIds.has(candidate)) {
    candidate = `member-${slug}-${index}`;
    index += 1;
  }

  return candidate;
}

export function nextTripMemberColor(index: number): string {
  const palette = ["#0f766e", "#2563eb", "#f97316", "#64748b", "#7c3aed", "#db2777", "#0891b2", "#ca8a04"];
  return palette[index % palette.length];
}
