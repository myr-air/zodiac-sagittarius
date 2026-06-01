import { describe, expect, it } from "vitest";
import { createTripApiClient } from "@/src/trip/api-client";
import { createAccountApiClient } from "./api-client";

const baseUrl = process.env.SAGITTARIUS_E2E_API_BASE_URL;
const required = process.env.SAGITTARIUS_E2E_REQUIRED === "1";

describe.skipIf(!required && !baseUrl)("real account portal API e2e", () => {
  it("creates an account trip, creates tasks, and returns portal to-dos plus vault", async () => {
    if (!baseUrl) {
      throw new Error("Set SAGITTARIUS_E2E_API_BASE_URL.");
    }

    const accountClient = createAccountApiClient({ baseUrl });
    const tripClient = createTripApiClient({ baseUrl });
    const runId = Date.now().toString(36);
    const account = await accountClient.finishPasswordLogin({
      flow: "register",
      email: `portal-e2e-${runId}@example.test`,
      password: "portal-e2e-password-2026",
      trustDevice: true,
      deviceLabel: "Portal e2e",
    });
    const created = await accountClient.createTrip(account.sessionToken, {
      name: `Portal E2E ${runId}`,
      destinationLabel: "Chiang Mai, Thailand",
      startDate: "2026-11-04",
      endDate: "2026-11-08",
      ownerDisplayName: "Portal E2E",
      joinId: `portal-e2e-${runId}`,
      joinPassword: `portal-e2e-password-${runId}`,
    });

    const taskTitles = [
      `Book train ${runId}`,
      `Pack passport ${runId}`,
      `Confirm hotel ${runId}`,
    ];
    for (const [index, title] of taskTitles.entries()) {
      await tripClient.createTask(created.trip.id, created.memberSession.sessionToken, {
        clientMutationId: `portal-e2e-task-${runId}-${index}`,
        title,
        visibility: index === 1 ? "private" : "shared",
        kind: index === 1 ? "prep" : "booking",
        assigneeId: null,
        relatedItemId: null,
      });
    }

    await expect(accountClient.listVault(account.sessionToken)).resolves.toEqual([]);
    const todos = await accountClient.listToDos(account.sessionToken);
    expect(todos.filter((todo) => todo.tripId === created.trip.id).map((todo) => todo.title).sort()).toEqual([...taskTitles].sort());
  }, 30_000);
});
