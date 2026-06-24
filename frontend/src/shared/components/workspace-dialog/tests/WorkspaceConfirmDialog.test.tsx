import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceConfirmDialog } from "../WorkspaceConfirmDialog";

describe("WorkspaceConfirmDialog", () => {
  it("renders shared confirmation chrome and reports actions", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <WorkspaceConfirmDialog
        body="This action cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Delete item"
        titleId="confirm-delete-title"
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Delete item" });
    expect(dialog).toHaveClass("delete-confirm-dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "confirm-delete-title");
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("can use an aria label when no title id is supplied", () => {
    render(
      <WorkspaceConfirmDialog
        body="Delete this album?"
        cancelLabel="Cancel"
        confirmLabel="Delete album"
        onCancel={() => undefined}
        onConfirm={() => undefined}
        title="Delete album"
      />,
    );

    expect(screen.getByRole("dialog", { name: "Delete album" })).toBeInTheDocument();
  });

  it("supports non-destructive confirmation dialogs", () => {
    render(
      <WorkspaceConfirmDialog
        body="Switch identity from Aom?"
        cancelLabel="Cancel"
        className="identity-switch-dialog w-[min(420px,100%)]"
        confirmLabel="Switch identity"
        confirmVariant="primary"
        onCancel={() => undefined}
        onConfirm={() => undefined}
        title="Switch identity"
        titleId="identity-switch-title"
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Switch identity" });
    expect(dialog).toHaveClass("identity-switch-dialog");
    expect(dialog).toHaveClass("grid");
    expect(within(dialog).getByRole("button", { name: "Switch identity" })).toHaveClass("button--primary");
  });

  it("focuses the safe action first, traps tab, closes on escape, and restores focus", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    const { rerender } = render(
      <button type="button">Open delete</button>,
    );

    const opener = screen.getByRole("button", { name: "Open delete" });
    opener.focus();

    rerender(
      <>
        <button type="button">Open delete</button>
        <WorkspaceConfirmDialog
          body="Delete this receipt?"
          cancelLabel="Cancel"
          confirmLabel="Delete"
          onCancel={onCancel}
          onConfirm={() => undefined}
          title="Delete receipt"
        />
      </>,
    );

    const dialog = screen.getByRole("dialog", { name: "Delete receipt" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.tab();
    expect(within(dialog).getByRole("button", { name: "Delete" })).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(within(dialog).getByRole("button", { name: "Delete" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(<button type="button">Open delete</button>);
    expect(screen.getByRole("button", { name: "Open delete" })).toHaveFocus();
  });
});
