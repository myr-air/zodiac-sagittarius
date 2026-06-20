import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { tripFixtureTasks } from "@/src/trip/trip-fixtures";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { OverviewPage } from "./OverviewPage";
import { renderOverview, renderOverviewElement as render } from "./OverviewPage.test-support";

import { beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-18T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OverviewPage role lenses", () => {
  it("uses English by default and switches overview headings to Thai", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <>
        <LanguageSwitch />
        <OverviewPage
          currentMemberId="member-beam"
          expenseSummary={buildExpenseSummary(seedTrip.expenses, "member-beam")}
          items={seedTrip.itineraryItems}
          suggestions={[]}
          tasks={tripFixtureTasks}
          trip={seedTrip}
          onCreateTask={vi.fn()}
          onOpenExpenses={vi.fn()}
          onToggleTaskStatus={vi.fn()}
        />
      </>,
    );

    expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Focus for today/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Language and currency" }));
    await user.click(screen.getByRole("menuitemradio", { name: "ภาษาไทย" }));
    expect(screen.getByRole("heading", { name: /วันนี้ต้องโฟกัส/i })).toBeInTheDocument();
  }, 30_000);

  it("renders the cockpit status hero and visual highlight board from trip data", () => {
    renderOverview("member-beam");

    const hero = screen.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i });
    expect(screen.getByRole("region", { name: /Trip overview/i })).toHaveClass("overview-page", "grid", "gap-3");
    expect(hero).toHaveClass("overview-hero", "grid", "overflow-hidden", "rounded-(--radius-lg)");
    expect(hero).toHaveClass("min-h-[168px]", "bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--overview-hero-sky)_100%)]");
    expect(hero).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(hero).toHaveTextContent(/Hong Kong/i);
    expect(within(hero).getByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })).toHaveClass("max-[767px]:hidden");
    expect(hero).toHaveTextContent(/HK\$/i);
    expect(within(hero).getByText(/ศูนย์จัดการทริป/i)).toBeInTheDocument();
    expect(hero.querySelector(".overview-hero-polaroid")).not.toBeInTheDocument();
    expect(hero.querySelector(".overview-hero-aside")).toHaveClass("bg-[rgb(255_255_255_/_0.72)]", "rounded-(--radius-md)");

    const cockpit = screen.getByRole("region", { name: /travel cockpit/i });
    expect(cockpit).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3", "gap-3");
    expect(within(cockpit).getByText(/จุดถัดไป/i).closest(".overview-cockpit-card")).toHaveClass(
      "overview-cockpit-card",
      "grid",
      "rounded-(--radius-lg)",
    );
    expect(within(cockpit).getByText(/จุดถัดไป/i)).toBeInTheDocument();
    expect(within(cockpit).getByText(/งบประมาณ/i)).toBeInTheDocument();
    expect(within(cockpit).getByText(/ทีมและความพร้อม/i)).toBeInTheDocument();

    const board = screen.getByRole("region", { name: /ไฮไลต์ทริป/i });
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

  it("does not spend a full-width highlight board on one repeated highlight", () => {
    render(
      <OverviewPage
        currentMemberId="member-nam"
        expenseSummary={buildExpenseSummary([], "member-nam")}
        items={[seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!]}
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

  it("combines booking prep into the trip checklist for managers", () => {
    renderOverview("member-beam");

    expect(screen.getByRole("region", { name: /วันนี้และจุดถัดไป/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /วันนี้ต้องโฟกัส/i })).toBeInTheDocument();
    expect(screen.getByText(/เดินทางออกจากกรุงเทพฯ \(BKK\)/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ตัวติดตามการจองและเตรียมตัว/i })).not.toBeInTheDocument();
    const checklist = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(within(checklist).getByRole("heading", { name: /เช็กลิสต์ทริปและการเตรียมตัว/i })).toBeInTheDocument();
    expect(within(checklist).getByText(/จอง Peak Tram/i)).toBeInTheDocument();
    expect(within(checklist).getAllByText(/การจอง/i).length).toBeGreaterThan(0);
  });

  it("prioritizes where to go and what to eat for travelers", () => {
    renderOverview("member-nam");

    expect(screen.getByRole("region", { name: /วันนี้และจุดถัดไป/i })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).getByText(/มุมมองการเดินทางของฉัน/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /ไฮไลต์ของนักเดินทาง/i })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: /ไฮไลต์ทริป/i })).getByText(/Dim Dim Sum ที่ Tim Ho Wan/i)).toBeInTheDocument();
    expect(screen.getAllByText(/อาหารเย็นที่ Temple Street Night Market/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dim Dim Sum ที่ Tim Ho Wan/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("region", { name: /ความพร้อมของทริป/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ให้ใครดูแล/i)).not.toBeInTheDocument();
  });

  it("prioritizes control and shared preparation for organizers", async () => {
    const user = userEvent.setup();
    renderOverview("member-beam");

    expect(within(screen.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).getByText(/ศูนย์จัดการทริป/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /ความพร้อมของทริป/i })).toBeInTheDocument();
    const checklist = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(checklist).toBeInTheDocument();
    expect(screen.queryByLabelText(/ให้ใครดูแล/i)).not.toBeInTheDocument();
    await user.click(within(checklist).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));
    expect(within(screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i })).getByLabelText(/ให้ใครดูแล/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /การแจ้งเตือน/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /งบประมาณ/i })).not.toBeInTheDocument();
  });

  it("shows a read-only trip snapshot for viewers", () => {
    renderOverview("member-family");

    expect(within(screen.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).getByText(/ภาพรวมทริป/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /ภาพรวมทริปแบบอ่านอย่างเดียว/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /เช็กลิสต์ของทริป/i })).not.toBeInTheDocument();
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
        onOpenExpenses={vi.fn()}
        onToggleTaskStatus={vi.fn()}
      />,
    );

    expect(screen.getByText(/ยังไม่มีแผนการเดินทางในทริปนี้/i)).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่มีไฮไลต์ในแผนนี้/i)).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่มีเช็กลิสต์ของคุณ/i)).toBeInTheDocument();
  });

});

describe("OverviewPage budget shortcuts", () => {
  it("opens the expense workspace from manager and traveler budget cards", async () => {
    const user = userEvent.setup();
    const { onOpenExpenses } = renderOverview("member-beam");

    await user.click(screen.getByRole("button", { name: /เปิดค่าใช้จ่าย/i }));

    expect(onOpenExpenses).toHaveBeenCalled();
  });

  it("offers an explicit shortcut for logging general trip expenses", async () => {
    const user = userEvent.setup();
    const { onOpenExpenses } = renderOverview("member-beam");

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่ายทั่วไป/i }));

    expect(onOpenExpenses).toHaveBeenCalled();
  });
});
