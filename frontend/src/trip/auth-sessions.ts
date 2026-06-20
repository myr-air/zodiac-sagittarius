import { createLocalSessionToken } from "./auth-local-secrets";
import { isTripParticipantDisabled } from "./auth-member-local";
import type { Member, Trip, TripParticipantSession } from "./types";

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
