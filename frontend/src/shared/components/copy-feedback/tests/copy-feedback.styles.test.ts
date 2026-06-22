import { describe, expect, it } from "vitest";
import {
  workspaceCopyFeedbackFrameClassName,
  workspaceCopyFeedbackStatusClassName,
  workspaceCopyFeedbackTextStatusClassName,
} from "../copy-feedback.styles";

describe("workspace copy feedback styles", () => {
  it("keeps common copy feedback frame styling in one shared class", () => {
    expect(workspaceCopyFeedbackFrameClassName).toContain("inline-flex");
    expect(workspaceCopyFeedbackFrameClassName).toContain("border-(--color-border)");
    expect(workspaceCopyFeedbackFrameClassName).toContain("text-(--color-text-muted)");
  });

  it("keeps bordered success and error state styling in one shared class", () => {
    expect(workspaceCopyFeedbackStatusClassName).toContain(
      "data-[state=copied]:border-(--color-success-border)",
    );
    expect(workspaceCopyFeedbackStatusClassName).toContain(
      "data-[state=error]:border-(--color-danger-border)",
    );
  });

  it("keeps text-only success and error state styling in one shared class", () => {
    expect(workspaceCopyFeedbackTextStatusClassName).toContain(
      "data-[state=copied]:text-(--color-success)",
    );
    expect(workspaceCopyFeedbackTextStatusClassName).toContain(
      "data-[state=error]:text-(--color-danger)",
    );
  });
});
