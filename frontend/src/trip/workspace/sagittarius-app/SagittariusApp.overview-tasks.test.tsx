import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  apiSeedTrip,
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  loginApiTrip,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit overview tasks", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
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

    render(<SagittariusApp requireJoin dataSource="api" apiClient={apiClient} />);
    await loginApiTrip(user);

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

  it("manages trip tasks from the overview checklist", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    expect(
      screen.getByRole("region", { name: /ความพร้อมของทริป/i }),
    ).toBeInTheDocument();
    const tasks = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(within(tasks).getByRole("button", { name: /ของฉัน/i })).toHaveClass(
      "overview-task-filter--active",
    );
    expect(within(tasks).getAllByText(/ส่วนตัว/i).length).toBeGreaterThan(0);
    expect(within(tasks).getAllByText(/แชร์ในทริป/i).length).toBeGreaterThan(0);
    expect(
      within(tasks).getByRole("checkbox", { name: /ซื้อ eSIM/i }),
    ).not.toBeChecked();

    const addTaskButton = within(tasks).getByRole("button", {
      name: /เพิ่มเช็กลิสต์/i,
    });
    expect(addTaskButton.textContent?.trim()).toBe("+");
    await user.click(addTaskButton);

    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(
      within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i),
      "แลกเงิน HKD",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/เก็บไว้ที่/i),
      "shared",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/ให้ใครดูแล/i),
      "member-nam",
    );
    await user.click(
      within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );

    expect(
      screen.queryByRole("dialog", { name: /เพิ่มเช็กลิสต์/i }),
    ).not.toBeInTheDocument();

    const newTask = within(tasks).getByRole("listitem", {
      name: /แลกเงิน HKD/i,
    });
    expect(within(newTask).getByText(/Explorer Friend/i)).toBeInTheDocument();
    expect(within(newTask).getByText(/แชร์ในทริป/i)).toBeInTheDocument();

    await user.click(
      within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    );
    expect(
      within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    ).toBeChecked();

    await user.click(within(tasks).getByRole("button", { name: /เสร็จแล้ว/i }));

    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/ซื้อ eSIM/i)).not.toBeInTheDocument();

    await user.click(
      within(tasks).getByRole("button", { name: /แชร์ในทริป/i }),
    );
    expect(within(tasks).getByText(/จอง Peak Tram/i)).toBeInTheDocument();

    await user.click(within(tasks).getByRole("button", { name: /ของฉัน/i }));
    await user.click(within(tasks).getByRole("button", { name: /ทุกสถานะ/i }));
    expect(within(tasks).getByText(/ซื้อ eSIM/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/จอง Peak Tram/i)).not.toBeInTheDocument();
  });
});
