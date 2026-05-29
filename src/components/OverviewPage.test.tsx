import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import type { TripTask } from "@/src/trip/types";
import { OverviewPage } from "./OverviewPage";

const seedTasks: TripTask[] = [
  { id: "task-esim", title: "ซื้อ eSIM", status: "open", visibility: "private", createdBy: "member-aom", assigneeId: "member-aom" },
  { id: "task-peak-tram", title: "จอง Peak Tram", status: "done", visibility: "shared", createdBy: "member-beam", assigneeId: "member-beam" },
  { id: "task-expenses", title: "สรุปค่าใช้จ่ายวันแรก", status: "open", visibility: "shared", createdBy: "member-beam", assigneeId: "member-beam" },
];

describe("OverviewPage role lenses", () => {
  it("combines today focus and booking prep for managers", () => {
    renderOverview("member-beam");

    expect(screen.getByRole("region", { name: /Today and next focus/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /วันนี้ต้องโฟกัส/i })).toBeInTheDocument();
    expect(screen.getByText(/เดินทางออกจากกรุงเทพฯ \(BKK\)/i)).toBeInTheDocument();
    const tracker = screen.getByRole("region", { name: /Booking and prep tracker/i });
    expect(tracker).toBeInTheDocument();
    expect(within(tracker).getByText(/จอง Peak Tram/i)).toBeInTheDocument();
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

  it("prioritizes control and shared preparation for organizers", () => {
    renderOverview("member-beam");

    expect(screen.getByRole("heading", { name: /คุมทริปให้พร้อม/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Trip readiness/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Trip checklist/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ให้ใครดูแล/i)).toBeInTheDocument();
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
});

function renderOverview(currentMemberId: string) {
  render(
    <OverviewPage
      currentMemberId={currentMemberId}
      expenseSummary={buildExpenseSummary(seedTrip.expenses, currentMemberId)}
      items={seedTrip.itineraryItems}
      suggestions={[]}
      tasks={seedTasks}
      trip={seedTrip}
      onCreateTask={vi.fn()}
      onToggleTaskStatus={vi.fn()}
    />,
  );
}
