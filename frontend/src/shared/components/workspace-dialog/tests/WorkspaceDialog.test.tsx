import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceDialog } from "../WorkspaceDialog";

describe("WorkspaceDialog", () => {
  it("renders shared modal chrome with labelled title and close action", () => {
    const onClose = vi.fn();

    render(
      <WorkspaceDialog
        closeAriaLabel="Close dialog"
        onClose={onClose}
        title="Edit item"
        titleId="workspace-dialog-title"
      >
        <p>Dialog body</p>
      </WorkspaceDialog>,
    );

    const dialog = screen.getByRole("dialog", { name: "Edit item" });
    expect(dialog).toHaveClass("grid");
    expect(dialog).toHaveAttribute("aria-labelledby", "workspace-dialog-title");
    expect(screen.getByText("Dialog body")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps content in a form when submit handling is provided", () => {
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(
      <WorkspaceDialog
        ariaLabel="Add item"
        closeAriaLabel="Close"
        formClassName="dialog-form"
        onClose={() => undefined}
        onSubmit={onSubmit}
        title="Add item"
      >
        <button type="submit">Save</button>
      </WorkspaceDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("dialog", { name: "Add item" })).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
