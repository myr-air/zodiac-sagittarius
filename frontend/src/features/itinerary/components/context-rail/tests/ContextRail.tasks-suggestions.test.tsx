import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  renderContextRail,
  selectedContextRailItem,
} from "../testing/ContextRail.test-support";

describe("ContextRail tasks and suggestions", () => {
  it("switches booking tasks and reviews suggestions", () => {
    const props = renderContextRail();

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
  });

  it("shows empty booking fallbacks when no tasks or booking warnings exist", async () => {
    renderContextRail({
      canEdit: false,
      canCreateNote: false,
      canReviewSuggestions: false,
      stopNotes: [],
      tasks: [],
      selectedItem: { ...selectedContextRailItem, advisories: [] },
    });

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
});
