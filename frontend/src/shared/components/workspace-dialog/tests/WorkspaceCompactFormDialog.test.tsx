import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/src/ui";
import { WorkspaceCompactFormDialog } from "../WorkspaceCompactFormDialog";

describe("WorkspaceCompactFormDialog", () => {
  it("renders compact form dialog chrome and submits through the shared shell", () => {
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(
      <WorkspaceCompactFormDialog
        actions={<Button type="submit">Import itinerary</Button>}
        className="import-options-dialog w-[min(520px,100%)]"
        onSubmit={onSubmit}
        title="Import options"
        titleId="import-options-title"
      >
        <p>Choose how to import this itinerary.</p>
      </WorkspaceCompactFormDialog>,
    );

    const dialog = screen.getByRole("dialog", { name: "Import options" });
    expect(dialog).toHaveClass("import-options-dialog");
    expect(dialog).toHaveClass("grid");
    expect(dialog).toHaveAttribute("aria-labelledby", "import-options-title");
    expect(dialog.querySelector("form")).not.toHaveAttribute("role", "dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Import itinerary" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
