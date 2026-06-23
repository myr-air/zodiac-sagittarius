import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { photoCopy } from "../../content/TripPhotosPage.copy";
import {
  PhotoCopyFeedback,
  photoCopyFeedbackLabel,
} from "../PhotoCopyFeedback";

describe("PhotoCopyFeedback", () => {
  it("centralizes photo copy status labels", () => {
    expect(photoCopyFeedbackLabel({
      copy: photoCopy.en,
      copyState: "copied",
    })).toBe("Copied");
    expect(photoCopyFeedbackLabel({
      copy: photoCopy.en,
      copyState: "error",
    })).toBe("Copy failed");
  });

  it("renders the shared photo copy status pill", () => {
    render(<PhotoCopyFeedback copy={photoCopy.en} copyState="copied" />);

    const status = screen.getByRole("status", { name: "Album link copy status" });
    expect(status).toHaveTextContent("Copied");
    expect(status).toHaveClass("photo-copy-feedback");
    expect(status).toHaveAttribute("data-state", "copied");
  });
});
