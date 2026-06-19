import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { ContextRail } from "@/src/features/itinerary/components";
import { buildBookingDoc } from "@/src/features/itinerary/testing";

const selectedItem =
  tripFixture.planItems.find((item) => item.id === "item-dimdim") ??
  tripFixture.planItems[0];

function renderRail(
  overrides: Partial<Parameters<typeof ContextRail>[0]> = {},
) {
  const props: Parameters<typeof ContextRail>[0] = {
    trip: tripFixture.trip,
    selectedItem,
    suggestions: tripFixture.suggestions,
    stopNotes: tripFixture.stopNotes,
    tasks: tripFixture.tasks,
    bookingDocs: tripFixture.trip.bookingDocs ?? [],
    currentMember: tripFixture.currentMembers.owner,
    expenseSummary: tripFixture.expenseSummaries.owner,
    canEdit: true,
    canCreateNote: true,
    canCreateSuggestion: true,
    canReviewSuggestions: true,
    canEditExpenses: true,
    open: true,
    onCreateNote: vi.fn(),
    onCreateExpense: vi.fn(),
    onUpdateExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
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

    fireEvent.click(screen.getByRole("button", { name: "ปิดรายละเอียด" }));
    expect(props.onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้"), {
      target: { value: "  call restaurant  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).toHaveBeenCalledWith({
      itemId: selectedItem.id,
      body: "call restaurant",
    });

    fireEvent.click(screen.getByRole("tab", { name: "การจอง" }));
    const bookingPanel = screen.getByRole("region", {
      name: "การจองและการเตรียมตัวของจุดนี้",
    });
    fireEvent.click(
      within(bookingPanel).getByRole("checkbox", {
        name: /ยืนยันคิว Dim Dim Sum/,
      }),
    );
    expect(props.onToggleTaskStatus).toHaveBeenCalledWith(
      "task-dimdim-booking",
    );

    fireEvent.click(screen.getByRole("tab", { name: "ข้อเสนอ" }));
    fireEvent.click(screen.getAllByRole("button", { name: /^อนุมัติ/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /^ปฏิเสธ/ })[0]);
    expect(props.onReviewSuggestion).toHaveBeenCalledWith(
      tripFixture.suggestions[0].id,
      "approved",
    );
    expect(props.onReviewSuggestion).toHaveBeenCalledWith(
      tripFixture.suggestions[0].id,
      "rejected",
    );

    fireEvent.click(screen.getByRole("tab", { name: "โน้ต" }));
    expect(
      screen.getByRole("region", { name: "โน้ตของจุดนี้" }),
    ).toBeInTheDocument();
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
    expect(
      screen.getByText("ไม่มีคำเตือนการจองสำหรับจุดนี้"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ยังไม่มีเอกสารการจองที่ผูกกับจุดนี้"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ยังไม่มี checklist ที่ผูกกับจุดนี้"),
    ).toBeInTheDocument();
  });

  it("shows booking docs linked to the selected itinerary item", async () => {
    const onChangeBookingDocType = vi.fn();
    const onChangeBookingDocQuickFields = vi.fn();
    renderRail({
      onChangeBookingDocType,
      onChangeBookingDocQuickFields,
      bookingDocs: [
        buildBookingDoc({
          id: "booking-dimdim-1",
          tripId: tripFixture.trip.id,
          tripPlanId: selectedItem.planVariantId,
          type: "activity_ticket",
          title: "Dim Dim Sum reservation",
          status: "booked",
          ownerMemberId: tripFixture.currentMembers.owner.id,
          providerName: "Dim Dim Sum",
          confirmationCode: "DDS-42",
          timezone: "Asia/Hong_Kong",
          travelerIds: [tripFixture.currentMembers.owner.id],
          relatedItineraryItemIds: [selectedItem.id],
          notes: "Window table",
          createdBy: tripFixture.currentMembers.owner.id,
        }),
        buildBookingDoc({
          id: "booking-other-1",
          tripId: tripFixture.trip.id,
          tripPlanId: selectedItem.planVariantId,
          type: "other",
          title: "Other stop ticket",
          status: "booked",
          ownerMemberId: tripFixture.currentMembers.owner.id,
          timezone: "Asia/Hong_Kong",
          relatedItineraryItemIds: ["other-item"],
          createdBy: tripFixture.currentMembers.owner.id,
        }),
      ],
    });

    await userEvent.click(screen.getByRole("tab", { name: "การจอง" }));
    const bookingPanel = screen.getByRole("region", {
      name: "การจองและการเตรียมตัวของจุดนี้",
    });
    expect(
      within(bookingPanel).getByText("Dim Dim Sum reservation"),
    ).toBeInTheDocument();
    expect(within(bookingPanel).getByText("การจอง · booked")).toBeInTheDocument();
    const typeSelect = within(bookingPanel).getByLabelText(
      "ประเภทการจองของ Dim Dim Sum reservation",
    );
    expect(typeSelect).toHaveValue("activity_ticket");
    fireEvent.change(typeSelect, { target: { value: "other" } });
    expect(onChangeBookingDocType).toHaveBeenCalledWith(
      "booking-dimdim-1",
      "other",
    );
    fireEvent.change(
      within(bookingPanel).getByLabelText(
        "ผู้ให้บริการของ Dim Dim Sum reservation",
      ),
      { target: { value: "Updated supplier" } },
    );
    fireEvent.blur(
      within(bookingPanel).getByLabelText(
        "ผู้ให้บริการของ Dim Dim Sum reservation",
      ),
    );
    expect(onChangeBookingDocQuickFields).toHaveBeenCalledWith(
      "booking-dimdim-1",
      { providerName: "Updated supplier" },
    );
    fireEvent.change(
      within(bookingPanel).getByLabelText(
        "รหัสอ้างอิงของ Dim Dim Sum reservation",
      ),
      { target: { value: "DDS-99" } },
    );
    fireEvent.blur(
      within(bookingPanel).getByLabelText(
        "รหัสอ้างอิงของ Dim Dim Sum reservation",
      ),
    );
    expect(onChangeBookingDocQuickFields).toHaveBeenCalledWith(
      "booking-dimdim-1",
      { confirmationCode: "DDS-99" },
    );
    expect(
      within(bookingPanel).queryByText("Other stop ticket"),
    ).not.toBeInTheDocument();
  });

  it("ignores empty note form submissions even when the browser submits the form", () => {
    const props = renderRail();

    fireEvent.submit(
      screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้").closest("form")!,
    );

    expect(props.onCreateNote).not.toHaveBeenCalled();
  });

  it("neutralizes unsafe selected item map links", () => {
    renderRail({
      selectedItem: {
        ...selectedItem,
        mapLink: "javascript:alert(document.domain)",
      },
    });

    expect(
      screen.getByRole("link", { name: "เปิดใน Google Maps" }),
    ).toHaveAttribute("href", "#");
  });

  it("lets the current note owner edit and delete their stop notes", () => {
    const props = renderRail({
      currentMember: tripFixture.trip.members.find(
        (member) => member.id === "member-beam",
      )!,
    });

    fireEvent.click(screen.getByRole("button", { name: /แก้ไขโน้ต/i }));
    fireEvent.change(screen.getByLabelText("แก้ไขโน้ต"), {
      target: { value: "Updated queue plan" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /บันทึกการแก้ไขโน้ต/i }),
    );

    expect(props.onUpdateNote).toHaveBeenCalledWith({
      noteId: "note-dimdim-1",
      body: "Updated queue plan",
    });

    fireEvent.click(screen.getByRole("button", { name: /ลบโน้ต/i }));
    expect(props.onDeleteNote).toHaveBeenCalledWith("note-dimdim-1");
  });

  it("creates, updates, and deletes stop expenses", () => {
    const props = renderRail({
      trip: {
        ...tripFixture.trip,
        expenses: [
          {
            id: "expense-dimdim-1",
            title: "Dim sum",
            amount: 240,
            paidBy: "member-aom",
            splits: {},
            category: "food",
            itineraryItemId: selectedItem.id,
            version: 1,
          },
        ],
      },
    });

    expect(
      screen.getByText(
        "ใช้เฉพาะเงินที่จ่ายแล้วหรือผูกพันต้องจ่าย ประมาณการให้เก็บใน booking draft หรือโน้ต",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("ชื่อค่าใช้จ่ายจริง"), {
      target: { value: "Taxi" },
    });
    fireEvent.change(screen.getByLabelText("จำนวนเงิน"), {
      target: { value: "120" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "เพิ่ม/แก้ไขค่าใช้จ่ายจริง" }),
    );

    expect(props.onCreateExpense).toHaveBeenCalledWith({
      itemId: selectedItem.id,
      title: "Taxi",
      amount: 120,
      paidBy: tripFixture.currentMembers.owner.id,
      category: "food",
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Edit expense Dim sum/i }),
    );
    fireEvent.change(screen.getByLabelText("ชื่อค่าใช้จ่ายจริง"), {
      target: { value: "Dim sum edited" },
    });
    fireEvent.change(screen.getByLabelText("จำนวนเงิน"), {
      target: { value: "260" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึก" }));

    expect(props.onUpdateExpense).toHaveBeenCalledWith({
      expenseId: "expense-dimdim-1",
      title: "Dim sum edited",
      amount: 260,
      paidBy: "member-aom",
      category: "food",
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Delete expense Dim sum/i }),
    );
    expect(props.onDeleteExpense).toHaveBeenCalledWith("expense-dimdim-1");
  });
});
