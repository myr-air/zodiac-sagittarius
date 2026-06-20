import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { tripFixtureTasks } from "@/src/trip/trip-fixtures";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { OverviewPage } from "./OverviewPage";
import {
  installOverviewPageClock,
  renderOverview,
  renderOverviewElement as render,
} from "./OverviewPage.test-support";

beforeEach(() => {
  installOverviewPageClock();
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
