import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit overview local tasks", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

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
