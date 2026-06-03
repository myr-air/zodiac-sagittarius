import { describe, expect, it } from "vitest";
import { createTripApiClient, TripApiError } from "./api-client";

const baseUrl = process.env.SAGITTARIUS_E2E_API_BASE_URL;
const joinId = process.env.SAGITTARIUS_E2E_JOIN_ID;
const tripPassword = process.env.SAGITTARIUS_E2E_TRIP_PASSWORD;
const participantPassword = process.env.SAGITTARIUS_E2E_PARTICIPANT_PASSWORD;
const required = process.env.SAGITTARIUS_E2E_REQUIRED === "1";
const hasCredentials = Boolean(baseUrl && joinId && tripPassword && participantPassword);

describe.skipIf(!required && !hasCredentials)("real Sagittarius API e2e", () => {
  it("joins a real backend and runs core production write flows", async () => {
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
      session = await client.claimMember(join.trip.id, member.id, participantPassword, join.joinSessionToken);
    } catch (caught) {
      if (!(caught instanceof TripApiError) || caught.code !== "invalid_request") throw caught;
      session = await client.loginMember(join.trip.id, member.id, participantPassword, join.joinSessionToken);
    }

    const cockpit = await client.loadTrip(join.trip.id, session.sessionToken);
    expect(cockpit.trip.id).toBe(join.trip.id);
    expect(cockpit.trip.members.length).toBeGreaterThan(0);
    expect(cockpit.trip.planVariants.length).toBeGreaterThan(0);
    const planVariantId = cockpit.trip.activePlanVariantId || cockpit.trip.planVariants[0].id;
    const firstItem = cockpit.trip.itineraryItems[0];
    expect(firstItem).toBeTruthy();

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

    const runId = Date.now().toString(36);
    const createdItem = await client.createItineraryItem(join.trip.id, session.sessionToken, {
      clientMutationId: `e2e-item-create-${runId}`,
      planVariantId,
      day: firstItem.day,
      startTime: "15:45",
      activity: `E2E stop ${runId}`,
      activityType: "experience",
      place: "E2E pier",
      mapLink: "https://maps.google.com/?q=E2E%20pier",
      durationMinutes: 30,
      transportation: "walk",
      note: "created by real API e2e",
    });
    expect(createdItem).toMatchObject({ activity: `E2E stop ${runId}`, planVariantId });

    const dayItemIds = [
      createdItem.id,
      ...cockpit.trip.itineraryItems
        .filter((item) => item.planVariantId === createdItem.planVariantId && item.day === createdItem.day)
        .map((item) => item.id),
    ];
    const reorderedItems = await client.reorderItineraryItems(join.trip.id, session.sessionToken, {
      clientMutationId: `e2e-item-reorder-${runId}`,
      planVariantId: createdItem.planVariantId,
      day: createdItem.day,
      itemIds: dayItemIds,
    });
    expect(reorderedItems.map((item) => item.id)).toEqual(dayItemIds);

    const createdNote = await client.createStopNote(join.trip.id, session.sessionToken, {
      clientMutationId: `e2e-note-create-${runId}`,
      itineraryItemId: createdItem.id,
      body: "E2E note",
    });
    expect(createdNote).toMatchObject({ itemId: createdItem.id, body: "E2E note" });
    const patchedNote = await client.patchStopNote(join.trip.id, createdNote.id, session.sessionToken, {
      clientMutationId: `e2e-note-patch-${runId}`,
      expectedVersion: createdNote.version ?? 1,
      body: "E2E note updated",
    });
    expect(patchedNote).toMatchObject({ id: createdNote.id, body: "E2E note updated", version: (createdNote.version ?? 1) + 1 });
    await expect(client.deleteStopNote(join.trip.id, createdNote.id, session.sessionToken)).resolves.toMatchObject({ id: createdNote.id });

    const amountMinor = 12345;
    const splits = { [member.id]: amountMinor };
    const createdExpense = await client.createExpense(join.trip.id, session.sessionToken, {
      clientMutationId: `e2e-expense-create-${runId}`,
      title: "E2E snack",
      amountMinor,
      currency: "HKD",
      paidBy: member.id,
      category: "food",
      splits,
      itineraryItemId: createdItem.id,
    });
    expect(createdExpense).toMatchObject({ title: "E2E snack", amount: 123.45, itineraryItemId: createdItem.id });
    const patchedExpense = await client.patchExpense(join.trip.id, createdExpense.id, session.sessionToken, {
      clientMutationId: `e2e-expense-patch-${runId}`,
      expectedVersion: createdExpense.version ?? 1,
      title: "E2E snack updated",
      amountMinor: 13000,
      paidBy: member.id,
      category: "food",
      splits: { [member.id]: 13000 },
      itineraryItemId: createdItem.id,
    });
    expect(patchedExpense).toMatchObject({ id: createdExpense.id, title: "E2E snack updated", amount: 130 });
    await expect(client.deleteExpense(join.trip.id, createdExpense.id, session.sessionToken)).resolves.toMatchObject({ id: createdExpense.id });

    await expect(client.deleteItineraryItem(join.trip.id, createdItem.id, session.sessionToken)).resolves.toMatchObject({ id: createdItem.id });
  }, 30_000);
});
