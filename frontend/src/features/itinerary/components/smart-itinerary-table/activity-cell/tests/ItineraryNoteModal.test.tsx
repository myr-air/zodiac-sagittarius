import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import { ItineraryNoteModal } from "../ItineraryNoteModal";

const noteItem = buildItineraryItem();

describe("ItineraryNoteModal", () => {
  it("submits a note body", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <ItineraryNoteModal
        item={noteItem}
        locale="en"
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    await user.type(screen.getByRole("textbox"), "Boarding at gate 7");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    expect(onSave).toHaveBeenCalledWith("Boarding at gate 7");
  });

  it("fires close action from cancel button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ItineraryNoteModal
        item={noteItem}
        locale="en"
        onClose={onClose}
        onSave={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
  });
});
