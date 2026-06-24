import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiSeedTrip,
  createApiClientForTrip,
  renderApiSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit overview API tasks", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("creates overview tasks through the API client after backend login", async () => {
    const user = userEvent.setup();
    const ownerTrip = {
      ...apiSeedTrip(),
      joinPasswordHash: "",
    };
    const apiClient = createApiClientForTrip(ownerTrip, {
      createTask: vi.fn().mockResolvedValue({
        id: "task-api-created",
        title: "แลกเงิน HKD",
        status: "open",
        visibility: "shared",
        kind: "prep",
        createdBy: ownerTrip.members[0].id,
        assigneeId: ownerTrip.members[0].id,
        relatedItemId: null,
        version: 1,
      }),
      patchTask: vi.fn().mockResolvedValue({
        id: "task-api-created",
        title: "แลกเงิน HKD",
        status: "done",
        visibility: "shared",
        kind: "prep",
        createdBy: ownerTrip.members[0].id,
        assigneeId: null,
        relatedItemId: null,
        version: 2,
      }),
    });

    await renderApiSagittariusApp(user, { apiClient });

    const tasks = await screen.findByRole("region", {
      name: /เช็กลิสต์ของทริป/i,
    });
    await user.click(
      within(tasks).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );
    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(
      within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i),
      "แลกเงิน HKD",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/เก็บไว้ที่/i),
      "shared",
    );
    await user.click(
      within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );

    expect(apiClient.createTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "session-token",
      expect.objectContaining({
        title: "แลกเงิน HKD",
        visibility: "shared",
        assigneeId: null,
      }),
    );
    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();

    await user.click(
      within(tasks).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    );

    expect(apiClient.patchTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "task-api-created",
      "session-token",
      expect.objectContaining({
        expectedVersion: 1,
        patch: { status: "done" },
      }),
    );
  }, 45_000);
});
