import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { ContextRail } from "./ContextRail";

const selectedItem = tripFixture.planItems.find((item) => item.id === "item-dimdim") ?? tripFixture.planItems[0];

function renderRail(overrides: Partial<Parameters<typeof ContextRail>[0]> = {}) {
  const props: Parameters<typeof ContextRail>[0] = {
    trip: tripFixture.trip,
    selectedItem,
    suggestions: tripFixture.suggestions,
    stopNotes: tripFixture.stopNotes,
    tasks: tripFixture.tasks,
    currentMember: tripFixture.currentMembers.owner,
    expenseSummary: tripFixture.expenseSummaries.owner,
    canEdit: true,
    canCreateNote: true,
    canCreateSuggestion: true,
    canReviewSuggestions: true,
    canEditExpenses: true,
    open: true,
    onCreateNote: vi.fn(),
    onEditSelected: vi.fn(),
    onReviewSuggestion: vi.fn(),
    onSuggestSelected: vi.fn(),
    onToggleTaskStatus: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<ContextRail {...props} />);
  return props;
}

describe("ContextRail", () => {
  it("creates notes, switches booking tasks, and reviews suggestions", async () => {
    const props = renderRail();

    await userEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(props.onClose).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้"), "  call restaurant  ");
    await userEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).toHaveBeenCalledWith({ itemId: selectedItem.id, body: "call restaurant" });

    await userEvent.click(screen.getByRole("tab", { name: "การจอง" }));
    const bookingPanel = screen.getByRole("region", { name: "Booking and prep for this stop" });
    await userEvent.click(within(bookingPanel).getByRole("checkbox", { name: /ยืนยันคิว Dim Dim Sum/ }));
    expect(props.onToggleTaskStatus).toHaveBeenCalledWith("task-dimdim-booking");

    await userEvent.click(screen.getByRole("tab", { name: "ข้อเสนอ" }));
    await userEvent.click(screen.getAllByRole("button", { name: /^อนุมัติ/ })[0]);
    await userEvent.click(screen.getAllByRole("button", { name: /^ปฏิเสธ/ })[0]);
    expect(props.onReviewSuggestion).toHaveBeenCalledWith(tripFixture.suggestions[0].id, "approved");
    expect(props.onReviewSuggestion).toHaveBeenCalledWith(tripFixture.suggestions[0].id, "rejected");

    await userEvent.click(screen.getByRole("tab", { name: "โน้ต" }));
    expect(screen.getByRole("region", { name: "Stop notes" })).toBeInTheDocument();
  });

  it("uses suggestion mode and read-only fallbacks when editing is unavailable", async () => {
    const props = renderRail({
      canEdit: false,
      canCreateNote: false,
      canReviewSuggestions: false,
      stopNotes: [],
      tasks: [],
      selectedItem: { ...selectedItem, advisories: [] },
    });

    expect(screen.getByText("ยังไม่มีโน้ตสำหรับจุดนี้")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "บันทึกโน้ต" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "เสนอแก้ไข" }));
    expect(props.onSuggestSelected).toHaveBeenCalled();
    expect(screen.getByText("อ่านอย่างเดียว")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "การจอง" }));
    expect(screen.getByText("ไม่มีคำเตือนการจองสำหรับจุดนี้")).toBeInTheDocument();
    expect(screen.getByText("ยังไม่มี checklist ที่ผูกกับจุดนี้")).toBeInTheDocument();
  });

  it("ignores empty note form submissions even when the browser submits the form", () => {
    const props = renderRail();

    fireEvent.submit(screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้").closest("form")!);

    expect(props.onCreateNote).not.toHaveBeenCalled();
  });
});
