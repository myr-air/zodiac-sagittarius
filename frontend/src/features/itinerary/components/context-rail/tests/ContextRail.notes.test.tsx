import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTripFixtureMember } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  renderContextRail,
  selectedContextRailItem,
} from "../testing/support/context-rail-render";

describe("ContextRail notes", () => {
  it("creates notes and ignores empty submissions", () => {
    const props = renderContextRail();

    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).not.toHaveBeenCalled();

    fireEvent.submit(
      screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้").closest("form")!,
    );
    expect(props.onCreateNote).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("เพิ่มโน้ตสำหรับจุดนี้"), {
      target: { value: "  call restaurant  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(props.onCreateNote).toHaveBeenCalledWith({
      itemId: selectedContextRailItem.id,
      body: "call restaurant",
    });
  });

  it("lets the current note owner edit and delete their stop notes", () => {
    const props = renderContextRail({
      currentMember: getTripFixtureMember("organizer"),
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
});
