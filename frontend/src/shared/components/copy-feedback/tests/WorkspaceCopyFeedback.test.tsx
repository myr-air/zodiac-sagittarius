import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  WorkspaceCopyFeedback,
  workspaceCopyFeedbackLabel,
} from "../WorkspaceCopyFeedback";

const labels = {
  copied: "Copied",
  error: "Copy failed",
  readOnly: "Read-only link",
  ready: "Ready to copy",
};

describe("WorkspaceCopyFeedback", () => {
  it("centralizes state and read-only copy labels", () => {
    expect(workspaceCopyFeedbackLabel({ labels, state: "idle" })).toBe(
      "Ready to copy",
    );
    expect(workspaceCopyFeedbackLabel({ labels, state: "copied" })).toBe(
      "Copied",
    );
    expect(
      workspaceCopyFeedbackLabel({ labels, readOnly: true, state: "error" }),
    ).toBe("Read-only link");
  });

  it("renders the shared copy status element", () => {
    render(
      <WorkspaceCopyFeedback
        aria-label="Copy status"
        className="copy-feedback"
        labels={labels}
        state="copied"
      />,
    );

    const status = screen.getByRole("status", { name: "Copy status" });
    expect(status).toHaveTextContent("Copied");
    expect(status).toHaveClass("copy-feedback");
    expect(status).toHaveAttribute("data-state", "copied");
  });
});
