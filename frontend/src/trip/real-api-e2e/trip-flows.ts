import { expect } from "vitest";
import type { RealApiE2eContext } from "./context";

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
