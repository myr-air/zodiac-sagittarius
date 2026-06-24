import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import {
  ExpenseCopyFeedback,
  expenseCopyFeedbackLabel,
} from "../ExpenseCopyFeedback";

describe("ExpenseCopyFeedback", () => {
  it("centralizes expense statement copy labels", () => {
    expect(expenseCopyFeedbackLabel({
      copyState: "idle",
      t: enMessages,
    })).toBe("Ready to share");
    expect(expenseCopyFeedbackLabel({
      copyState: "copied",
      t: enMessages,
    })).toBe("Copied");
    expect(expenseCopyFeedbackLabel({
      copyState: "error",
      t: enMessages,
    })).toBe("Copy failed");
  });

  it("renders the shared expense copy feedback status", () => {
    render(<ExpenseCopyFeedback copyState="copied" t={enMessages} />);

    const status = screen.getByRole("status", { name: "Statement copy status" });
    expect(status).toHaveTextContent("Copied");
    expect(status).toHaveClass("expense-copy-feedback");
    expect(status).toHaveAttribute("data-state", "copied");
  });
});
