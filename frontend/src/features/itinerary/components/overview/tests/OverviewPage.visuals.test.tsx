import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { getTripFixtureItineraryItem, tripFixtureTasks } from "@/src/trip/testing/fixtures/trip-fixtures";
import { OverviewPage } from "../OverviewPage";
import {
  installOverviewPageClock,
  renderOverview,
  renderOverviewElement as render,
} from "./support/overview-page-render";

beforeEach(() => {
  installOverviewPageClock();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OverviewPage visual summary", () => {
  it("renders the cockpit status hero and visual highlight board from trip data", () => {
    renderOverview("member-beam");

    const hero = screen.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i });
    expect(screen.getByRole("region", { name: /Trip overview/i })).toHaveClass(
      "overview-page",
      "flex",
      "flex-col",
      "gap-4",
      "max-[767px]:bg-(--color-surface-subtle)",
      "max-[767px]:px-2",
    );
    expect(document.querySelector(".overview-summary-bento")).toHaveClass("grid", "grid-cols-12", "max-[1199px]:grid-cols-1");
    expect(hero).toHaveClass("overview-hero", "grid", "overflow-hidden", "rounded-(--radius-lg)");
    expect(hero).toHaveClass(
      "col-span-12",
      "min-h-[126px]",
      "bg-[linear-gradient(135deg,var(--color-surface)_0%,color-mix(in_srgb,var(--overview-hero-sky)_62%,white)_100%)]",
    );
    expect(hero).toHaveClass("max-[767px]:rounded-(--radius-lg)", "max-[767px]:border");
    expect(hero).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(hero).toHaveTextContent(/Hong Kong/i);
    expect(within(hero).getByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })).toHaveClass("max-[767px]:hidden");
    expect(hero).toHaveTextContent(/HK\$/i);
    expect(within(hero).getByText(/ศูนย์จัดการทริป/i)).toBeInTheDocument();
    expect(hero.querySelector(".overview-hero-polaroid")).not.toBeInTheDocument();
    expect(hero.querySelector(".overview-hero-aside")).toHaveClass("bg-[rgb(255_255_255_/_0.76)]", "rounded-(--radius-md)");

    const cockpit = screen.getByRole("region", { name: /travel cockpit/i });
    expect(cockpit).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3", "col-span-12");
    expect(within(cockpit).getByText(/จุดถัดไป/i).closest(".overview-cockpit-card")).toHaveClass(
      "overview-cockpit-card",
      "grid",
      "border-r",
    );
    expect(within(cockpit).getByText(/จุดถัดไป/i)).toBeInTheDocument();
    expect(within(cockpit).getByText(/งบประมาณ/i)).toBeInTheDocument();
    expect(within(cockpit).getByText(/ทีมและความพร้อม/i)).toBeInTheDocument();

    const phase = screen.getByRole("region", { name: /ระหว่างทริป/i });
    expect(phase).toHaveClass("overview-phase-card", "col-span-12");
    expect(within(phase).getByRole("heading", { name: /ค็อกพิทวันนี้/i })).toBeInTheDocument();
    expect(within(phase).getAllByText(/จุดถัดไป/i).length).toBeGreaterThan(0);
    expect(within(phase).getByText(/ช่วงอากาศ/i)).toBeInTheDocument();

    const readiness = screen.getByRole("region", { name: /ความพร้อมของทริป/i });
    const checklist = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(readiness.compareDocumentPosition(phase)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(checklist.compareDocumentPosition(phase)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    const board = screen.getByRole("region", { name: /ไฮไลต์ทริป/i });
    expect(phase.compareDocumentPosition(board)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(board).getByRole("heading", { name: /ไฮไลต์ทริป/i })).toBeInTheDocument();
    expect(within(board).getByText(/ของกินและสถานที่จากแผนนี้/i)).toBeInTheDocument();
    expect(within(board).getByText(/Dim Dim Sum ที่ Tim Ho Wan/i)).toBeInTheDocument();
    expect(within(board).getByText(/อาหารเย็นที่ Temple Street Night Market/i)).toHaveClass("[overflow-wrap:anywhere]");
    expect(within(board).getByRole("list")).toHaveClass("overview-highlight-list", "max-[767px]:snap-x", "max-[767px]:overscroll-x-contain");
    expect(within(board).getAllByRole("listitem")).toHaveLength(4);
  });

  it("keeps the cockpit overview useful for empty trips", () => {
    render(
      <OverviewPage
        currentMemberId="member-beam"
        expenseSummary={buildExpenseSummary([], "member-beam")}
        items={[]}
        suggestions={[]}
        tasks={[]}
        trip={{ ...seedTrip, itineraryItems: [] }}
        onCreateTask={vi.fn()}
        onOpenExpenses={vi.fn()}
        onToggleTaskStatus={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่มีแผนการเดินทางในทริปนี้/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /ไฮไลต์ทริป/i })).toHaveTextContent(/ยังไม่มีไฮไลต์ในแผนนี้/i);
  });

  it("changes phase guidance before and after the trip dates", () => {
    const commonProps = {
      currentMemberId: "member-beam",
      expenseSummary: buildExpenseSummary(seedTrip.expenses, "member-beam"),
      items: seedTrip.itineraryItems,
      suggestions: [],
      tasks: tripFixtureTasks,
      onCreateTask: vi.fn(),
      onOpenExpenses: vi.fn(),
      onToggleTaskStatus: vi.fn(),
    };

    const { unmount } = render(
      <OverviewPage
        {...commonProps}
        trip={{ ...seedTrip, startDate: "2026-07-01", endDate: "2026-07-05" }}
      />,
    );
    const beforeTrip = screen.getByRole("region", { name: /ก่อนวันเดินทาง/i });
    expect(within(beforeTrip).getByRole("heading", { name: /ความพร้อมก่อนออกเดินทาง/i })).toBeInTheDocument();
    expect(within(beforeTrip).getByText(/ต้องแก้ก่อนเดินทาง/i)).toBeInTheDocument();
    expect(within(beforeTrip).getByText(/เช็กลิสต์ค้าง/i)).toBeInTheDocument();

    unmount();

    render(
      <OverviewPage
        {...commonProps}
        trip={{ ...seedTrip, startDate: "2026-05-01", endDate: "2026-05-05" }}
      />,
    );
    const afterTrip = screen.getByRole("region", { name: /หลังจบทริป/i });
    expect(within(afterTrip).getByRole("heading", { name: /ปิดงานทริป/i })).toBeInTheDocument();
    expect(within(afterTrip).getByText(/3 รายการชำระคืน/i)).toBeInTheDocument();
    const readiness = screen.getByRole("region", { name: /ความพร้อมของทริป/i });
    const checklist = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(afterTrip.compareDocumentPosition(readiness)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(afterTrip.compareDocumentPosition(checklist)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(checklist).not.toHaveClass("overview-task-panel");
    const expenseShortcut = screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i });
    expect(expenseShortcut).toHaveClass("overview-panel--button");
    expect(expenseShortcut.querySelector(".icon")).toBeInTheDocument();
    expect(screen.queryByText(/จุดถัดไป/i)).not.toBeInTheDocument();
    expect(screen.getByText(/จุดที่ไปแล้ว/i)).toBeInTheDocument();
  });

  it("does not spend a full-width highlight board on one repeated highlight", () => {
    render(
      <OverviewPage
        currentMemberId="member-nam"
        expenseSummary={buildExpenseSummary([], "member-nam")}
        items={[getTripFixtureItineraryItem("item-dimdim")]}
        suggestions={[]}
        tasks={[]}
        trip={seedTrip}
        onCreateTask={vi.fn()}
        onOpenExpenses={vi.fn()}
        onToggleTaskStatus={vi.fn()}
      />,
    );

    expect(screen.queryByRole("region", { name: /ไฮไลต์ทริป/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Dim Dim Sum/i).length).toBeGreaterThan(0);
  });
});
