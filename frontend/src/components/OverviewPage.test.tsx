import { render, screen, within } from "@testing-library/react";
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
