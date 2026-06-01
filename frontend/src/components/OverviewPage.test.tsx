import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { tripFixtureTasks } from "@/src/demo/trip-fixtures";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { OverviewPage } from "./OverviewPage";

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, { locale: "th" });

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

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));
    expect(screen.getByRole("heading", { name: /วันนี้ต้องโฟกัส/i })).toBeInTheDocument();
  }, 30_000);

  it("renders the photo-first cockpit hero and visual highlight board from trip data", () => {
    renderOverview("member-beam");

    const hero = screen.getByRole("banner", { name: /Hong Kong Food Crawl/i });
    expect(hero).toHaveTextContent(/Hong Kong/i);
    expect(hero).toHaveTextContent(/HK\$/i);
    expect(within(hero).getByText(/ศูนย์จัดการทริป/i)).toBeInTheDocument();

    const cockpit = screen.getByRole("region", { name: /travel cockpit/i });
    expect(within(cockpit).getByText(/Next stop/i)).toBeInTheDocument();
    expect(within(cockpit).getByText(/Trip readiness/i)).toBeInTheDocument();
    expect(within(cockpit).getByText(/Budget/i)).toBeInTheDocument();

    const board = screen.getByRole("region", { name: /trip highlight board/i });
    expect(within(board).getByText(/Dim Dim Sum ที่ Tim Ho Wan/i)).toBeInTheDocument();
    expect(within(board).getByText(/อาหารเย็นที่ Temple Street Night Market/i)).toBeInTheDocument();
  });

  it("keeps the photo-first overview useful for empty trips", () => {
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

    expect(screen.getByRole("banner", { name: /Hong Kong Food Crawl/i })).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่มี itinerary ในแผนนี้/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /trip highlight board/i })).toHaveTextContent(/ยังไม่มีไฮไลต์ในแผนนี้/i);
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
    expect(screen.getByRole("heading", { name: /มุมมองการเดินทางของฉัน/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /ไฮไลต์ของนักเดินทาง/i })).toBeInTheDocument();
    expect(screen.getByText(/อาหารเย็นที่ Temple Street Night Market/i)).toBeInTheDocument();
    expect(screen.getByText(/Dim Dim Sum ที่ Tim Ho Wan/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ความพร้อมของทริป/i })).not.toBeInTheDocument();
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

  it("prioritizes control and shared preparation for organizers", async () => {
    const user = userEvent.setup();
    renderOverview("member-beam");

    expect(screen.getByRole("heading", { name: /ศูนย์จัดการทริป/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /ความพร้อมของทริป/i })).toBeInTheDocument();
    const checklist = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(checklist).toBeInTheDocument();
    expect(screen.queryByLabelText(/ให้ใครดูแล/i)).not.toBeInTheDocument();
    await user.click(within(checklist).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));
    expect(within(screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i })).getByLabelText(/ให้ใครดูแล/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /การแจ้งเตือน/i })).toBeInTheDocument();
  });

  it("shows a read-only trip snapshot for viewers", () => {
    renderOverview("member-family");

    expect(screen.getByRole("heading", { name: /ภาพรวมทริป/i })).toBeInTheDocument();
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
        onOpenExpenses={vi.fn()}
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

function renderOverview(currentMemberId: string) {
  const onOpenExpenses = vi.fn();
  render(
    <OverviewPage
      currentMemberId={currentMemberId}
      expenseSummary={buildExpenseSummary(seedTrip.expenses, currentMemberId)}
      items={seedTrip.itineraryItems}
      suggestions={[]}
      tasks={tripFixtureTasks}
      trip={seedTrip}
      onCreateTask={vi.fn()}
      onOpenExpenses={onOpenExpenses}
      onToggleTaskStatus={vi.fn()}
    />,
  );
  return { onOpenExpenses };
}

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
