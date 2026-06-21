import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "../../api-client";
import { cockpitResponse, jsonResponse } from "../../testing/support/api-client-test-utils";

describe("Trip API client task routes", () => {
  it("creates and patches tasks through authenticated backend routes", async () => {
    const createdTask = {
      ...cockpitResponse.tasks[0],
      id: "018f4e84-1111-7000-8000-000000000002",
      title: "Exchange HKD",
      status: "open",
      version: 1,
    };
    const patchedTask = { ...createdTask, status: "done", version: 2 };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(createdTask, 201))
      .mockResolvedValueOnce(jsonResponse(patchedTask));
    const client = createTripApiClient({ baseUrl: "https://api.example.test/", fetchImpl });

    const task = await client.createTask(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "web-task-1",
      title: "Exchange HKD",
      visibility: "shared",
      kind: "prep",
      assigneeId: cockpitResponse.members[0].id,
      relatedItemId: null,
    });
    const doneTask = await client.patchTask(cockpitResponse.trip.id, task.id, "session-token", {
      clientMutationId: "web-task-2",
      expectedVersion: 1,
      patch: { status: "done" },
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/tasks`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/tasks/${createdTask.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          clientMutationId: "web-task-2",
          expectedVersion: 1,
          patch: { status: "done" },
        }),
      }),
    );
    expect(task).toMatchObject({ id: createdTask.id, title: "Exchange HKD", version: 1 });
    expect(doneTask).toMatchObject({ id: createdTask.id, status: "done", version: 2 });
  });
});
