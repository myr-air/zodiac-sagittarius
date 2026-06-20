import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  renderContextRail,
  selectedContextRailItem,
} from "./ContextRail.test-support";

describe("ContextRail", () => {
  it("creates notes, switches booking tasks, and reviews suggestions", async () => {
    const props = renderContextRail();

    fireEvent.click(screen.getByRole("button", { name: "ปิดรายละเอียด" }));
    expect(props.onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้"), {
      target: { value: "  call restaurant  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).toHaveBeenCalledWith({
      itemId: selectedContextRailItem.id,
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
    const props = renderContextRail({
      canEdit: false,
      canCreateNote: false,
      canReviewSuggestions: false,
      stopNotes: [],
      tasks: [],
      selectedItem: { ...selectedContextRailItem, advisories: [] },
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

  it("ignores empty note form submissions even when the browser submits the form", () => {
    const props = renderContextRail();

    fireEvent.submit(
      screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้").closest("form")!,
    );

    expect(props.onCreateNote).not.toHaveBeenCalled();
  });

  it("neutralizes unsafe selected item map links", () => {
    renderContextRail({
      selectedItem: {
        ...selectedContextRailItem,
        mapLink: "javascript:alert(document.domain)",
      },
    });

    expect(
      screen.getByRole("link", { name: "เปิดใน Google Maps" }),
    ).toHaveAttribute("href", "#");
  });

  it("lets the current note owner edit and delete their stop notes", () => {
    const props = renderContextRail({
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
    const props = renderContextRail({
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
            itineraryItemId: selectedContextRailItem.id,
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
      itemId: selectedContextRailItem.id,
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
