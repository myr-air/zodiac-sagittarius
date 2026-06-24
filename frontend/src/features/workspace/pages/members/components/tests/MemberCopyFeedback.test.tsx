import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import {
  MemberCopyFeedback,
  memberCopyFeedbackLabel,
} from "../MemberCopyFeedback";

describe("MemberCopyFeedback", () => {
  it("centralizes invite copy feedback labels", () => {
    expect(memberCopyFeedbackLabel({
      copyState: "idle",
      labels: enMessages,
    })).toBe("Ready to invite");
    expect(memberCopyFeedbackLabel({
      copyState: "copied",
      labels: enMessages,
    })).toBe("Copied");
    expect(memberCopyFeedbackLabel({
      copyState: "error",
      labels: enMessages,
    })).toBe("Copy failed");
    expect(memberCopyFeedbackLabel({
      copyState: "idle",
      labels: enMessages,
      readOnly: true,
    })).toBe("Read only");
  });

  it("renders the shared status pill with copy state", () => {
    render(<MemberCopyFeedback copyState="copied" labels={enMessages} />);

    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    expect(screen.getByRole("status")).toHaveClass("copy-feedback");
    expect(screen.getByRole("status")).toHaveAttribute("data-state", "copied");
  });
});
