import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  renderContextRail,
  selectedContextRailItem,
} from "./ContextRail.test-support";

describe("ContextRail shell", () => {
  it("closes the rail and uses read-only fallbacks when editing is unavailable", async () => {
    const props = renderContextRail({
      canEdit: false,
      canCreateNote: false,
      canReviewSuggestions: false,
      stopNotes: [],
      tasks: [],
      selectedItem: { ...selectedContextRailItem, advisories: [] },
    });

    fireEvent.click(screen.getByRole("button", { name: "ปิดรายละเอียด" }));
    expect(props.onClose).toHaveBeenCalled();
    expect(screen.getByText("ยังไม่มีโน้ตสำหรับจุดนี้")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "บันทึกโน้ต" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "เสนอแก้ไข" }));
    expect(props.onSuggestSelected).toHaveBeenCalled();
    expect(screen.getByText("อ่านอย่างเดียว")).toBeInTheDocument();
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
});
