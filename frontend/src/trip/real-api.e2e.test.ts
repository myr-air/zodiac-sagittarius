import { describe, expect, it } from "vitest";
import { createTripApiClient, TripApiError } from "./api-client";

const baseUrl = process.env.SAGITTARIUS_E2E_API_BASE_URL;
const joinId = process.env.SAGITTARIUS_E2E_JOIN_ID;
const tripPassword = process.env.SAGITTARIUS_E2E_TRIP_PASSWORD;
const participantPassword = process.env.SAGITTARIUS_E2E_PARTICIPANT_PASSWORD;
const required = process.env.SAGITTARIUS_E2E_REQUIRED === "1";
const hasCredentials = Boolean(baseUrl && joinId && tripPassword && participantPassword);

describe.skipIf(!required && !hasCredentials)("real Sagittarius API e2e", () => {
  it("joins a real backend, hydrates cockpit data, and creates a task", async () => {
    if (!hasCredentials || !baseUrl || !joinId || !tripPassword || !participantPassword) {
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
      session = await client.claimMember(join.trip.id, member.id, participantPassword);
    } catch (caught) {
      if (!(caught instanceof TripApiError) || caught.code !== "invalid_request") throw caught;
      session = await client.loginMember(join.trip.id, member.id, participantPassword);
    }

    const cockpit = await client.loadTrip(join.trip.id, session.sessionToken);
    expect(cockpit.trip.id).toBe(join.trip.id);
    expect(cockpit.trip.members.length).toBeGreaterThan(0);
    expect(cockpit.trip.planVariants.length).toBeGreaterThan(0);

    const task = await client.createTask(join.trip.id, session.sessionToken, {
      clientMutationId: `e2e-task-${Date.now().toString(36)}`,
      title: `E2E connectivity ${new Date().toISOString()}`,
      visibility: "private",
      kind: "prep",
      assigneeId: member.id,
      relatedItemId: null,
    });
    expect(task).toMatchObject({
      status: "open",
      visibility: "private",
      createdBy: member.id,
    });
  }, 30_000);
});
