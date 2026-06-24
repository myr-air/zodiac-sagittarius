import { expect } from "vitest";
import { createTripApiClient, TripApiError } from "../api-client";
import type { TripApiClient, TripCockpit } from "../api-client";
import type {
  Member,
  TripParticipantSession,
} from "../types";
import { expectLoadedCockpit } from "./cockpit-assertions";

export const realApiE2eCredentials = {
  baseUrl: process.env.SAGITTARIUS_E2E_API_BASE_URL,
  joinId: process.env.SAGITTARIUS_E2E_JOIN_ID,
  participantPassword: process.env.SAGITTARIUS_E2E_PARTICIPANT_PASSWORD,
  required: process.env.SAGITTARIUS_E2E_REQUIRED === "1",
  tripPassword: process.env.SAGITTARIUS_E2E_TRIP_PASSWORD,
};

export const hasRealApiE2eCredentials = Boolean(
  realApiE2eCredentials.baseUrl &&
    realApiE2eCredentials.joinId &&
    realApiE2eCredentials.tripPassword &&
    realApiE2eCredentials.participantPassword,
);

export interface RealApiE2eContext {
  client: TripApiClient;
  cockpit: TripCockpit;
  join: Awaited<ReturnType<TripApiClient["joinTrip"]>>;
  member: Member;
  planVariantId: string;
  runId: string;
  session: TripParticipantSession;
}

export async function createRealApiE2eContext(): Promise<RealApiE2eContext> {
  const {
    baseUrl,
    joinId,
    participantPassword,
    tripPassword,
  } = realApiE2eCredentials;
  if (!hasRealApiE2eCredentials || !baseUrl || !joinId || !tripPassword || !participantPassword) {
    throw new Error(
      "Set SAGITTARIUS_E2E_API_BASE_URL, SAGITTARIUS_E2E_JOIN_ID, SAGITTARIUS_E2E_TRIP_PASSWORD, and SAGITTARIUS_E2E_PARTICIPANT_PASSWORD.",
    );
  }

  const client = createTripApiClient({ baseUrl });
  const join = await client.joinTrip({ joinId, password: tripPassword });
  const member = join.claimableMembers.find((candidate) => candidate.accessStatus === "active") ?? join.claimableMembers[0];
  expect(member).toBeTruthy();

  let session;
  try {
    session = await client.claimMember(join.trip.id, member.id, participantPassword, join.joinSessionToken);
  } catch (caught) {
    if (!(caught instanceof TripApiError) || caught.code !== "invalid_request") throw caught;
    session = await client.loginMember(join.trip.id, member.id, participantPassword, join.joinSessionToken);
  }

  const cockpit = await client.loadTrip(join.trip.id, session.sessionToken);
  expectLoadedCockpit(cockpit, join.trip.id);

  return {
    client,
    cockpit,
    join,
    member,
    planVariantId: cockpit.trip.activePlanVariantId || cockpit.trip.planVariants[0].id,
    runId: Date.now().toString(36),
    session,
  };
}
