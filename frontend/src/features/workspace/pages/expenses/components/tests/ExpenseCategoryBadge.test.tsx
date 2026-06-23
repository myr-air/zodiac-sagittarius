import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpenseCategoryBadge } from "../ExpenseCategoryBadge";

describe("ExpenseCategoryBadge", () => {
  it("renders the category with centralized tone styles", () => {
    render(<ExpenseCategoryBadge category="food" />);

    const badge = screen.getByText("food");

    expect(badge).toHaveClass(
      "inline-flex",
      "rounded-full",
      "capitalize",
    );
    expect(badge).toHaveStyle({
      backgroundColor: "#fff7ed",
      borderColor: "#fed7aa",
      color: "#9a3412",
    });
  });

  it("accepts a precomputed tone from overview display models", () => {
    render(
      <ExpenseCategoryBadge
        category="transport"
        tone={{
          background: "#111111",
          border: "#222222",
          dot: "#333333",
          text: "#444444",
        }}
      />,
    );

    const badge = screen.getByText("transport");
    const dot = badge.firstElementChild;

    expect(badge).toHaveStyle({
      backgroundColor: "#111111",
      borderColor: "#222222",
      color: "#444444",
    });
    expect(dot).toHaveStyle({ backgroundColor: "#333333" });
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });
});
