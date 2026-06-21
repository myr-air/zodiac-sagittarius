import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { tripFixtureTasks } from "@/src/trip/trip-fixtures";
import { OverviewPage } from "../OverviewPage";
import {
  installOverviewPageClock,
  renderOverviewElement as render,
} from "./support/overview-page-render";

beforeEach(() => {
  installOverviewPageClock();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OverviewPage checklist workflows", () => {
  it("lets travelers filter, toggle, and add personal checklist items", async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn();
    const onToggleTaskStatus = vi.fn();
    render(
      <OverviewPage
        currentMemberId="member-nam"
        expenseSummary={buildExpenseSummary(seedTrip.expenses, "member-nam")}
        items={seedTrip.itineraryItems}
        suggestions={[]}
        tasks={[
          { id: "task-open", title: "Pack adapter", status: "open", visibility: "private", kind: "prep", createdBy: "member-nam", assigneeId: "member-nam" },
          { id: "task-done", title: "Download tickets", status: "done", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-nam", relatedItemId: "item-dimdim" },
        ]}
        trip={seedTrip}
        onCreateTask={onCreateTask}
        onOpenExpenses={vi.fn()}
        onToggleTaskStatus={onToggleTaskStatus}
      />,
    );

    const checklist = screen.getByRole("region", { name: /เช็กลิสต์เดินทางของฉัน/i });
    await user.click(within(checklist).getByRole("button", { name: /ยังไม่ได้ทำ/i }));
    expect(within(checklist).getByText("Pack adapter")).toBeInTheDocument();
    await user.click(within(checklist).getByRole("button", { name: /เรียบร้อย/i }));
    expect(within(checklist).getByText("Download tickets")).toBeInTheDocument();
    await user.click(within(checklist).getByRole("checkbox", { name: "Download tickets" }));
    expect(onToggleTaskStatus).toHaveBeenCalledWith("task-done");
    expect(screen.getByRole("status")).toHaveTextContent(/เปลี่ยนสถานะ Download tickets แล้ว/i);
    await user.click(screen.getByRole("button", { name: /เลิกทำ/i }));
    expect(onToggleTaskStatus).toHaveBeenCalledWith("task-done");

    await user.click(within(checklist).getByRole("button", { name: /ทั้งหมด/i }));
    await user.clear(within(checklist).getByLabelText(/เพิ่มของที่ต้องเตรียม/i));
    await user.type(within(checklist).getByLabelText(/เพิ่มของที่ต้องเตรียม/i), "  Bring umbrella  ");
    await user.click(within(checklist).getByRole("button", { name: "เพิ่ม" }));

    expect(onCreateTask).toHaveBeenCalledWith({ title: "Bring umbrella", visibility: "private", assigneeId: null });
  }, 30_000);

  it("cancels an empty manager checklist dialog without creating a task", async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn();
    render(
      <OverviewPage
        currentMemberId="member-beam"
        expenseSummary={buildExpenseSummary([], "member-beam")}
        items={[]}
        suggestions={[]}
        tasks={[]}
        trip={{ ...seedTrip, itineraryItems: [] }}
        onCreateTask={onCreateTask}
        onOpenExpenses={vi.fn()}
        onToggleTaskStatus={vi.fn()}
      />,
    );

    expect(screen.getByText(/ยังไม่มีแผนการเดินทางในทริปนี้/i)).toBeInTheDocument();
    expect(screen.getByText(/ไม่มีงานในตัวกรองนี้/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    fireEvent.submit(within(dialog).getByLabelText(/เพิ่มเช็กลิสต์/i).closest("form")!);
    expect(onCreateTask).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText(/เพิ่มเช็กลิสต์/i), "  Pack charger  ");
    await user.click(within(dialog).getByRole("button", { name: /ยกเลิก/i }));

    expect(onCreateTask).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: /เพิ่มเช็กลิสต์/i })).not.toBeInTheDocument();
  });

  it("creates shared assigned tasks from the manager dialog and filters done tasks", async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn();
    const onToggleTaskStatus = vi.fn();
    render(
      <OverviewPage
        currentMemberId="member-beam"
        expenseSummary={buildExpenseSummary(seedTrip.expenses, "member-beam")}
        items={seedTrip.itineraryItems}
        suggestions={[]}
        tasks={tripFixtureTasks}
        trip={seedTrip}
        onCreateTask={onCreateTask}
        onOpenExpenses={vi.fn()}
        onToggleTaskStatus={onToggleTaskStatus}
      />,
    );

    const checklist = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    await user.click(within(checklist).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(within(dialog).getByLabelText(/เพิ่มเช็กลิสต์/i), "Confirm ferry");
    await user.selectOptions(within(dialog).getByLabelText(/เก็บไว้ที่/i), "shared");
    await user.selectOptions(within(dialog).getByLabelText(/ให้ใครดูแล/i), "member-nam");
    await user.click(within(dialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));

    expect(onCreateTask).toHaveBeenCalledWith({ title: "Confirm ferry", visibility: "shared", assigneeId: "member-nam" });

    await user.click(within(checklist).getByRole("button", { name: /เสร็จแล้ว/i }));
    expect(within(checklist).getByText(/จอง Peak Tram/i)).toBeInTheDocument();
    await user.click(within(checklist).getByRole("checkbox", { name: /จอง Peak Tram/i }));
    expect(onToggleTaskStatus).toHaveBeenCalledWith("task-peak-tram");

    await user.click(within(checklist).getByRole("button", { name: /ทุกสถานะ/i }));
    await user.click(within(checklist).getByRole("button", { name: /ค้าง/i }));
    expect(within(checklist).getByText(/ยืนยันคิว Dim Dim Sum/i)).toBeInTheDocument();
    await user.click(within(checklist).getByRole("button", { name: /ทุกสถานะ/i }));
    await user.click(within(checklist).getByRole("button", { name: /ทั้งหมด/i }));
    expect(within(checklist).getByText(/ซื้อ eSIM/i)).toBeInTheDocument();
  });
});
