import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { SmartItineraryTable } from "./SmartItineraryTable";

function renderTable(overrides: Partial<Parameters<typeof SmartItineraryTable>[0]> = {}) {
  const props: Parameters<typeof SmartItineraryTable>[0] = {
    canRedo: false,
    canRestructure: true,
    canUndo: false,
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    role: "owner",
    startDate: tripFixture.trip.startDate,
    selectedItemId: tripFixture.planItems[0].id,
    tripName: tripFixture.trip.name,
    onAddStop: vi.fn(),
    onSelectItem: vi.fn(),
    onMoveItem: vi.fn(),
    onRedo: vi.fn(),
    onToggleContextRail: vi.fn(),
    onUndo: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<SmartItineraryTable {...props} />, { locale: "th" });
  return props;
}

describe("SmartItineraryTable", () => {
  it("uses English itinerary shell labels by default and Thai after switching", () => {
    renderWithI18n(
      <>
        <LanguageSwitch />
        <SmartItineraryTable
          canRedo={false}
          canRestructure
          canUndo={false}
          contextRailOpen={false}
          endDate={tripFixture.trip.endDate}
          items={tripFixture.planItems}
          role="owner"
          startDate={tripFixture.trip.startDate}
          selectedItemId={tripFixture.planItems[0].id}
          tripName={tripFixture.trip.name}
          onAddStop={vi.fn()}
          onSelectItem={vi.fn()}
          onMoveItem={vi.fn()}
          onRedo={vi.fn()}
          onToggleContextRail={vi.fn()}
          onUndo={vi.fn()}
        />
      </>,
    );

    const actions = screen.getByRole("group", { name: /Itinerary actions/i });
    expect(within(actions).getByRole("button", { name: /Add stop or activity/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ภาษาไทย" }));
    expect(within(actions).getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeInTheDocument();
  }, 30_000);

  it("uses explicit controls for row selection instead of making table rows interactive", () => {
    const onSelectItem = vi.fn();
    const props = renderTable({ onSelectItem });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    expect(row).not.toHaveAttribute("tabindex");
    fireEvent.keyDown(row, { key: "Enter" });
    expect(props.onSelectItem).not.toHaveBeenCalled();

    fireEvent.click(within(row).getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }));
    expect(props.onSelectItem).toHaveBeenCalledWith("item-dimdim");
    expect(within(row).getByText("Shop G72, G/F, The Elements")).toBeVisible();
    onSelectItem.mockClear();
    fireEvent.keyDown(within(row).getByRole("link", { name: /แผนที่/i }), { key: "Enter", bubbles: true });
    expect(props.onSelectItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /ย่อ วันที่ 2/i }));
    expect(document.querySelector('tr[aria-label*="Dim Dim Sum"]')).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes hybrid Tailwind bridge classes for the table shell and selected row", () => {
    renderTable({ selectedItemId: "item-dimdim" });

    const panel = screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i });
    expect(panel).toHaveClass("table-panel", "grid", "min-h-full");

    const scrollFrame = screen.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i);
    expect(scrollFrame).toHaveClass("table-scroll", "overflow-x-auto", "rounded-[var(--radius-md)]");

    const table = screen.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i });
    expect(table).toHaveClass("smart-table", "w-full", "min-w-[960px]");

    const selectedRow = screen.getByRole("row", { name: /Dim Dim Sum/i });
    expect(selectedRow).toHaveClass("data-row", "data-row--selected");
    expect(within(selectedRow).getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toHaveClass("row-select", "grid", "min-w-0");
    expect(within(selectedRow).getByRole("link", { name: /แผนที่/i })).toHaveClass("map-link", "underline");
  });

  it("offers button-based reorder controls for touch and keyboard users", async () => {
    const user = userEvent.setup();
    const props = renderTable();
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    expect(within(row).getByRole("button", { name: /ย้าย .*Dim Dim Sum.*ขึ้น/i })).toBeDisabled();
    await user.click(within(row).getByRole("button", { name: /ย้าย .*Dim Dim Sum.*ลง/i }));

    expect(props.onMoveItem).toHaveBeenCalledWith("item-victoria-peak", "item-dimdim");
  });

  it("prevents dragging when role or restructure settings disallow editing", () => {
    renderTable({ role: "viewer", canRestructure: false });

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่/i })).toBeDisabled();
    expect(screen.getByText("ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ลาก Dim Dim Sum/i })).toBeDisabled();
  });

  it("ignores drag previews and drops that cannot move an item", () => {
    const props = renderTable({ canRestructure: false });
    const dataTransfer = createDataTransfer();
    const row = screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }).closest("tr")!;

    fireEvent.dragOver(row, { dataTransfer });
    fireEvent.drop(row, { dataTransfer });

    expect(props.onMoveItem).not.toHaveBeenCalled();
    expect(row).not.toHaveClass("data-row--drop-target");
  });

  it("ignores missing and self-targeted drag payloads", () => {
    const props = renderTable();
    const row = screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }).closest("tr")!;

    fireEvent.dragOver(row, { dataTransfer: createDataTransfer() });
    expect(row).not.toHaveClass("data-row--drop-target");

    const selfTransfer = createDataTransfer();
    selfTransfer.setData("text/plain", "item-dimdim");
    fireEvent.dragOver(row, { dataTransfer: selfTransfer });
    fireEvent.drop(row, { dataTransfer: selfTransfer });

    expect(props.onMoveItem).not.toHaveBeenCalled();
  });
});

function createDataTransfer() {
  const values = new Map<string, string>();

  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: (type: string) => values.get(type) ?? "",
    setData: (type: string, value: string) => values.set(type, value),
  };
}
