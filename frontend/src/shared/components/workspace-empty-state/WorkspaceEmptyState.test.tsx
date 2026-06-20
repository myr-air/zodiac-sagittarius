import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";

describe("WorkspaceEmptyState", () => {
  it("renders a compact workspace empty state with caller layout classes", () => {
    const { container } = render(
      <WorkspaceEmptyState
        title="No matching files"
        detail="Try another folder, status, or search term."
        className="min-h-[180px] rounded-(--radius-md)"
      />,
    );

    expect(screen.getByText("No matching files")).toHaveClass("text-(--color-text)");
    expect(screen.getByText("Try another folder, status, or search term.")).toHaveClass(
      "text-sm",
      "font-medium",
      "leading-6",
      "text-(--color-text-muted)",
    );
    expect(container.firstElementChild).toHaveClass("grid", "place-items-center", "min-h-[180px]", "rounded-(--radius-md)");
  });
});
