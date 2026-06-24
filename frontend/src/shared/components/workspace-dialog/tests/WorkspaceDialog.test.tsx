import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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

  it("moves focus inside, traps keyboard tabbing, closes on Escape, and restores focus", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
          {open ? (
            <WorkspaceDialog
              closeAriaLabel="Close dialog"
              onClose={() => {
                onClose();
                setOpen(false);
              }}
              title="Edit item"
              titleId="focus-dialog-title"
            >
              <button type="button">First action</button>
              <button type="button">Last action</button>
            </WorkspaceDialog>
          ) : null}
        </>
      );
    }

    render(<Harness />);

    const opener = screen.getByRole("button", { name: "Open dialog" });
    opener.focus();
    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Edit item" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    const close = screen.getByRole("button", { name: "Close dialog" });
    const last = screen.getByRole("button", { name: "Last action" });
    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });
});
