import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineOptionPickerOptionContent } from "../InlineOptionPickerOptionContent";

describe("InlineOptionPickerOptionContent", () => {
  it("renders the shared option label and selected marker", () => {
    render(
      <InlineOptionPickerOptionContent
        option={{ icon: "train", label: "Train", value: "train" }}
        trailingMarker="✓"
      />,
    );

    expect(screen.getByText("Train")).toBeInTheDocument();
    expect(screen.getByText("✓")).toHaveAttribute("aria-hidden", "true");
  });
});
