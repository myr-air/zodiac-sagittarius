import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpenseMemberLine } from "../ExpenseMemberLine";

describe("ExpenseMemberLine", () => {
  it("renders the member avatar and name with shared expense styles", () => {
    render(<ExpenseMemberLine color="#2563eb" name="Aom" />);

    expect(screen.getByText("A")).toHaveClass("inline-grid", "rounded-full");
    expect(screen.getByText("A")).toHaveStyle({ backgroundColor: "#2563eb" });
    expect(screen.getByText("Aom")).toHaveClass("font-extrabold");
  });

  it("renders optional balance metadata under the member name", () => {
    render(
      <ExpenseMemberLine
        color="#0f766e"
        name="Demo Traveler"
        meta="gets back HK$25.00"
      />,
    );

    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("Demo Traveler")).toBeInTheDocument();
    expect(screen.getByText("gets back HK$25.00")).toHaveClass("text-(--color-text-muted)");
  });
});
