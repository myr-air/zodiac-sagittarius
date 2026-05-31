import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
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
    onDeleteNote: vi.fn(),
    onEditSelected: vi.fn(),
    onUpdateNote: vi.fn(),
    onReviewSuggestion: vi.fn(),
    onSuggestSelected: vi.fn(),
    onToggleTaskStatus: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<ContextRail {...props} />, { locale: "th" });
  return props;
}

describe("ContextRail", () => {
  it("creates notes, switches booking tasks, and reviews suggestions", async () => {
    const props = renderRail();

    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(props.onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้"), { target: { value: "  call restaurant  " } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).toHaveBeenCalledWith({ itemId: selectedItem.id, body: "call restaurant" });

    fireEvent.click(screen.getByRole("tab", { name: "การจอง" }));
    const bookingPanel = screen.getByRole("region", { name: "Booking and prep for this stop" });
    fireEvent.click(within(bookingPanel).getByRole("checkbox", { name: /ยืนยันคิว Dim Dim Sum/ }));
    expect(props.onToggleTaskStatus).toHaveBeenCalledWith("task-dimdim-booking");

    fireEvent.click(screen.getByRole("tab", { name: "ข้อเสนอ" }));
    fireEvent.click(screen.getAllByRole("button", { name: /^อนุมัติ/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /^ปฏิเสธ/ })[0]);
    expect(props.onReviewSuggestion).toHaveBeenCalledWith(tripFixture.suggestions[0].id, "approved");
    expect(props.onReviewSuggestion).toHaveBeenCalledWith(tripFixture.suggestions[0].id, "rejected");

    fireEvent.click(screen.getByRole("tab", { name: "โน้ต" }));
    expect(screen.getByRole("region", { name: "Stop notes" })).toBeInTheDocument();
  }, 30_000);

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

  it("lets the current note owner edit and delete their stop notes", () => {
    const props = renderRail({
      currentMember: tripFixture.trip.members.find((member) => member.id === "member-beam")!,
    });

    fireEvent.click(screen.getByRole("button", { name: /แก้ไขโน้ต/i }));
    fireEvent.change(screen.getByLabelText("แก้ไขโน้ต"), { target: { value: "Updated queue plan" } });
    fireEvent.click(screen.getByRole("button", { name: /บันทึกการแก้ไขโน้ต/i }));

    expect(props.onUpdateNote).toHaveBeenCalledWith({ noteId: "note-dimdim-1", body: "Updated queue plan" });

    fireEvent.click(screen.getByRole("button", { name: /ลบโน้ต/i }));
    expect(props.onDeleteNote).toHaveBeenCalledWith("note-dimdim-1");
  });
});
