import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CopyFeedback } from "../CopyFeedback";

describe("CopyFeedback", () => {
  it("renders the shared copy status contract", () => {
    render(
      <CopyFeedback
        aria-label="Invite copy status"
        className="copy-feedback-test"
        label="Copied"
        state="copied"
      />,
    );

    const status = screen.getByRole("status", { name: "Invite copy status" });
    expect(status).toHaveTextContent("Copied");
    expect(status).toHaveClass("copy-feedback-test");
    expect(status).toHaveAttribute("data-state", "copied");
  });
});
