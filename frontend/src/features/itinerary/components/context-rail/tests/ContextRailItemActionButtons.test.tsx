import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContextRailItemActionButtons } from "../ContextRailItemActionButtons";

describe("ContextRailItemActionButtons", () => {
  it("renders shared icon actions and honors disabled state", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ContextRailItemActionButtons
        actions={[
          {
            ariaLabel: "Edit Dim sum",
            icon: "edit",
            onClick: onEdit,
          },
          {
            ariaLabel: "Delete Dim sum",
            disabled: true,
            icon: "trash",
            onClick: onDelete,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Dim sum" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Dim sum" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Delete Dim sum" }),
    ).toBeDisabled();
  });
});
