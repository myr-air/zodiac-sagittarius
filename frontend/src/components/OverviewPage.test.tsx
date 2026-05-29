import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { tripFixtureTasks } from "@/src/demo/trip-fixtures";
import { seedTrip } from "@/src/trip/seed";
import { OverviewPage } from "./OverviewPage";

describe("OverviewPage role lenses", () => {
  it("combines booking prep into the trip checklist for managers", () => {
    renderOverview("member-beam");

    expect(screen.getByRole("region", { name: /Today and next focus/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /วันนี้ต้องโฟกัส/i })).toBeInTheDocument();
    expect(screen.getByText(/เดินทางออกจากกรุงเทพฯ \(BKK\)/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Booking and prep tracker/i })).not.toBeInTheDocument();
    const checklist = screen.getByRole("region", { name: /Trip checklist/i });
    expect(within(checklist).getByRole("heading", { name: /เช็กลิสต์ทริปและการเตรียมตัว/i })).toBeInTheDocument();
    expect(within(checklist).getByText(/จอง Peak Tram/i)).toBeInTheDocument();
    expect(within(checklist).getAllByText(/การจอง/i).length).toBeGreaterThan(0);
  });

  it("prioritizes where to go and what to eat for travelers", () => {
    renderOverview("member-nam");

    expect(screen.getByRole("region", { name: /Today and next focus/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /เที่ยวอะไรต่อ/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Traveler highlights/i })).toBeInTheDocument();
    expect(screen.getByText(/อาหารเย็นที่ Temple Street Night Market/i)).toBeInTheDocument();
    expect(screen.getByText(/Dim Dim Sum ที่ Tim Ho Wan/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip readiness/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ให้ใครดูแล/i)).not.toBeInTheDocument();
  });

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
        onToggleTaskStatus={onToggleTaskStatus}
      />,
    );

    const checklist = screen.getByRole("region", { name: /My travel checklist/i });
    await user.click(within(checklist).getByRole("button", { name: /ยังไม่ได้ทำ/i }));
    expect(within(checklist).getByText("Pack adapter")).toBeInTheDocument();
    await user.click(within(checklist).getByRole("button", { name: /เรียบร้อย/i }));
    expect(within(checklist).getByText("Download tickets")).toBeInTheDocument();
    await user.click(within(checklist).getByRole("checkbox", { name: "Download tickets" }));
    expect(onToggleTaskStatus).toHaveBeenCalledWith("task-done");

    await user.click(within(checklist).getByRole("button", { name: /ทั้งหมด/i }));
    await user.clear(within(checklist).getByLabelText(/เพิ่มของที่ต้องเตรียม/i));
    await user.type(within(checklist).getByLabelText(/เพิ่มของที่ต้องเตรียม/i), "  Bring umbrella  ");
    await user.click(within(checklist).getByRole("button", { name: "เพิ่ม" }));

    expect(onCreateTask).toHaveBeenCalledWith({ title: "Bring umbrella", visibility: "private", assigneeId: null });
  });

  it("prioritizes control and shared preparation for organizers", async () => {
    const user = userEvent.setup();
    renderOverview("member-beam");

    expect(screen.getByRole("heading", { name: /คุมทริปให้พร้อม/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Trip readiness/i })).toBeInTheDocument();
    const checklist = screen.getByRole("region", { name: /Trip checklist/i });
    expect(checklist).toBeInTheDocument();
    expect(screen.queryByLabelText(/ให้ใครดูแล/i)).not.toBeInTheDocument();
    await user.click(within(checklist).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));
    expect(within(screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i })).getByLabelText(/ให้ใครดูแล/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /การแจ้งเตือน/i })).toBeInTheDocument();
  });

  it("shows a read-only trip snapshot for viewers", () => {
    renderOverview("member-family");

    expect(screen.getByRole("heading", { name: /ดูภาพรวมทริป/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Read-only trip snapshot/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip checklist/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/เพิ่มเช็กลิสต์/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เพิ่มเช็กลิสต์/i })).not.toBeInTheDocument();
  });

  it("handles empty traveler plans", () => {
    render(
      <OverviewPage
        currentMemberId="member-nam"
        expenseSummary={buildExpenseSummary([], "member-nam")}
        items={[]}
        suggestions={[]}
        tasks={[]}
        trip={{ ...seedTrip, itineraryItems: [] }}
        onCreateTask={vi.fn()}
        onToggleTaskStatus={vi.fn()}
      />,
    );

    expect(screen.getByText(/ยังไม่มี itinerary ในแผนนี้/i)).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่มีไฮไลต์ในแผนนี้/i)).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่มีเช็กลิสต์ของคุณ/i)).toBeInTheDocument();
  });

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
        onToggleTaskStatus={vi.fn()}
      />,
    );

    expect(screen.getByText(/ยังไม่มี itinerary ในแผนนี้/i)).toBeInTheDocument();
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
        onToggleTaskStatus={onToggleTaskStatus}
      />,
    );

    const checklist = screen.getByRole("region", { name: /Trip checklist/i });
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

function renderOverview(currentMemberId: string) {
  render(
    <OverviewPage
      currentMemberId={currentMemberId}
      expenseSummary={buildExpenseSummary(seedTrip.expenses, currentMemberId)}
      items={seedTrip.itineraryItems}
      suggestions={[]}
      tasks={tripFixtureTasks}
      trip={seedTrip}
      onCreateTask={vi.fn()}
      onToggleTaskStatus={vi.fn()}
    />,
  );
}
