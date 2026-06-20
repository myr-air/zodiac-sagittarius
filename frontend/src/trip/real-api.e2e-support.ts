import { expect } from "vitest";
import { createTripApiClient, TripApiError } from "./api-client";
import type { TripApiClient } from "./api-client";
import type {
  ItineraryItem,
  Member,
  TripParticipantSession,
  TripTask,
} from "./types";
import type { TripCockpit } from "./api-client";
import { cockpitResponse } from "./api-client.test-support";
import { pathIdRain } from "./testing/itinerary-path-fixtures";

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

export async function updatePresenceAndTripMetadata(context: RealApiE2eContext): Promise<void> {
  const { client, cockpit, join, member, session } = context;
  const onlineMember = await client.updatePresence(join.trip.id, session.sessionToken, {
    clientMutationId: `e2e-presence-${Date.now().toString(36)}`,
    presence: "online",
  });
  expect(onlineMember).toMatchObject({ id: member.id, presence: "online" });

  const patchedTrip = await client.patchTrip(join.trip.id, session.sessionToken, {
    clientMutationId: `e2e-trip-patch-${Date.now().toString(36)}`,
    expectedVersion: cockpit.trip.version ?? 1,
    name: `${cockpit.trip.name} E2E`,
    destinationLabel: cockpit.trip.destinationLabel,
    countries: cockpit.trip.countries ?? [],
  });
  expect(patchedTrip).toMatchObject({ id: join.trip.id, version: (cockpit.trip.version ?? 1) + 1 });
}

export async function createAndPublishE2eTripPlan(context: RealApiE2eContext): Promise<void> {
  const { client, join, runId, session } = context;
  const createdVariant = await client.createTripPlan!(join.trip.id, session.sessionToken, {
    clientMutationId: `e2e-plan-create-${runId}`,
    name: `E2E backup ${runId}`,
    kind: "backup",
    description: "created by real API e2e",
  });
  expect(createdVariant).toMatchObject({
    name: `E2E backup ${runId}`,
    kind: "backup",
    status: "backup",
    version: 1,
  });

  const patchedVariant = await client.patchTripPlan!(join.trip.id, createdVariant.id, session.sessionToken, {
    clientMutationId: `e2e-plan-patch-${runId}`,
    expectedVersion: createdVariant.version ?? 1,
    patch: { description: "updated by real API e2e" },
  });
  expect(patchedVariant).toMatchObject({
    id: createdVariant.id,
    description: "updated by real API e2e",
    kind: "backup",
    status: "backup",
    version: 2,
  });

  const publishedTrip = await client.setMainTripPlan!(join.trip.id, createdVariant.id, session.sessionToken, {
    clientMutationId: `e2e-plan-publish-${runId}`,
  });
  expect(publishedTrip.activePlanVariantId).toBe(createdVariant.id);
  expect(publishedTrip.mainTripPlanId).toBe(createdVariant.id);
  const reloadedAfterSetMain = await client.loadTrip(join.trip.id, session.sessionToken);
  expect(reloadedAfterSetMain.trip.activePlanVariantId).toBe(createdVariant.id);
  expect(reloadedAfterSetMain.trip.mainTripPlanId).toBe(createdVariant.id);
  expect(
    reloadedAfterSetMain.trip.tripPlans?.find((plan) => plan.id === createdVariant.id),
  ).toMatchObject({
    id: createdVariant.id,
    kind: "main",
    status: "main",
  });
  expect(
    reloadedAfterSetMain.trip.planVariants.find((plan) => plan.id === createdVariant.id),
  ).toMatchObject({
    id: createdVariant.id,
    kind: "main",
    status: "main",
  });
  context.planVariantId = createdVariant.id;
}

export async function createE2eTask(context: RealApiE2eContext): Promise<TripTask> {
  const { client, join, member, session } = context;
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
  return task;
}

export async function createE2eItineraryItemAndNote(context: RealApiE2eContext): Promise<ItineraryItem> {
  const { client, cockpit, join, planVariantId, runId, session } = context;
  const firstItem = cockpit.trip.itineraryItems[0];
  expect(firstItem).toBeTruthy();

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

  return createdItem;
}

export async function createE2eExpenseBookingAndCleanup(
  context: RealApiE2eContext,
  task: TripTask,
  createdItem: ItineraryItem,
): Promise<void> {
  const { client, join, member, runId, session } = context;
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

  const createdBooking = await client.createBookingDoc(join.trip.id, session.sessionToken, {
    clientMutationId: `e2e-booking-create-${runId}`,
    type: "activity_ticket",
    title: `E2E ticket ${runId}`,
    status: "booked",
    visibility: "shared",
    ownerMemberId: member.id,
    providerName: "E2E Provider",
    confirmationCode: `E2E-${runId}`,
    startsAt: null,
    endsAt: null,
    timezone: "Asia/Hong_Kong",
    priceAmount: 130,
    currency: "HKD",
    travelerIds: [member.id, member.id],
    externalLinks: [{ label: "Cloud voucher", url: "https://drive.google.com/e2e-ticket", provider: "Google Drive", accessNote: null }],
    relatedItineraryItemIds: [createdItem.id],
    relatedTaskIds: [task.id],
    relatedExpenseIds: [createdExpense.id],
    noteIds: [],
    notes: "E2E booking doc",
  });
  expect(createdBooking).toMatchObject({
    title: `E2E ticket ${runId}`,
    travelerIds: [member.id],
    relatedItineraryItemIds: [createdItem.id],
    relatedTaskIds: [task.id],
    relatedExpenseIds: [createdExpense.id],
  });
  const patchedBooking = await client.patchBookingDoc(join.trip.id, createdBooking.id, session.sessionToken, {
    clientMutationId: `e2e-booking-patch-${runId}`,
    expectedVersion: createdBooking.version,
    patch: {
      title: `E2E ticket updated ${runId}`,
      status: "confirmed",
    },
  });
  expect(patchedBooking).toMatchObject({ id: createdBooking.id, title: `E2E ticket updated ${runId}`, status: "confirmed", version: createdBooking.version + 1 });
  await expect(client.deleteBookingDoc(join.trip.id, createdBooking.id, session.sessionToken)).resolves.toMatchObject({ id: createdBooking.id });
  await expect(client.deleteExpense(join.trip.id, createdExpense.id, session.sessionToken)).resolves.toMatchObject({ id: createdExpense.id });
  await expect(client.deleteItineraryItem(join.trip.id, createdItem.id, session.sessionToken)).resolves.toMatchObject({ id: createdItem.id });
}

function expectLoadedCockpit(cockpit: TripCockpit, tripId: string): void {
  expect(cockpit.trip.id).toBe(tripId);
  expect(cockpit.trip.members.length).toBeGreaterThan(0);
  expect(cockpit.trip.planVariants.length).toBeGreaterThan(0);
  expect(cockpit.trip.tripPlans).toEqual(cockpit.trip.planVariants);
  expect(cockpit.trip.mainTripPlanId).toBe(cockpit.trip.activePlanVariantId);
  expect(cockpit.tasks).toEqual([
    {
      id: cockpitResponse.tasks[0].id,
      tripPlanId: cockpitResponse.planVariants![0].id,
      title: "Buy eSIM",
      status: "open",
      visibility: "private",
      kind: "prep",
      createdBy: cockpitResponse.members[0].id,
      assigneeId: cockpitResponse.members[0].id,
      relatedItemId: null,
      version: 1,
    },
  ]);
  expect(cockpit.stopNotes).toEqual(cockpitResponse.stopNotes);
  expect(cockpit.trip.expenses[0]).toMatchObject({
    id: cockpitResponse.expenses[0].id,
    tripPlanId: cockpitResponse.planVariants![0].id,
    amount: 240,
    splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 240 },
  });
  expect(cockpit.trip.itineraryItems[0]).toMatchObject({
    pathGroupId: "group-breakfast",
    pathId: pathIdRain,
    pathName: "Rain plan",
    pathRole: "alternative",
    endTime: "09:30",
    endOffsetDays: 0,
  });
  expect(cockpit.trip.bookingDocs?.[0]).toMatchObject({
    id: "booking-api-flight",
    tripPlanId: cockpitResponse.planVariants![0].id,
    externalLinks: [{ id: "booking-api-flight-link", label: "Drive", url: "https://drive.google.com/api-flight", provider: "Google Drive" }],
  });
  expect(cockpit.trip.photoAlbumLinks?.[0]).toMatchObject({
    id: "018f4e89-1111-7000-8000-000000000001",
    title: "API group album",
    provider: "google_photos",
  });
  expect(cockpit.expenseSummary).toEqual(cockpitResponse.expenseSummary);
}
