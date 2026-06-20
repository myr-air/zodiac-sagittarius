import { describe, it } from "vitest";
import {
  createAndPublishE2eTripPlan,
  createE2eExpenseBookingAndCleanup,
  createE2eItineraryItemAndNote,
  createE2eTask,
  createRealApiE2eContext,
  hasRealApiE2eCredentials,
  realApiE2eCredentials,
  updatePresenceAndTripMetadata,
} from "./real-api-e2e";

describe.skipIf(!realApiE2eCredentials.required && !hasRealApiE2eCredentials)("real Sagittarius API e2e", () => {
  it("joins a real backend and runs core production write flows", async () => {
    const context = await createRealApiE2eContext();

    await updatePresenceAndTripMetadata(context);
    await createAndPublishE2eTripPlan(context);
    const task = await createE2eTask(context);
    const createdItem = await createE2eItineraryItemAndNote(context);
    await createE2eExpenseBookingAndCleanup(context, task, createdItem);
  }, 30_000);
});
