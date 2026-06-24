import { describe, expect, it } from "vitest";

import { copyFeedbackLabel } from "../copy-feedback-labels";

describe("copyFeedbackLabel", () => {
  const labels = {
    copied: "Copied",
    error: "Copy failed",
    ready: "Ready to share",
  };

  it("selects labels from copy state", () => {
    expect(copyFeedbackLabel({ labels, state: "idle" })).toBe("Ready to share");
    expect(copyFeedbackLabel({ labels, state: "copied" })).toBe("Copied");
    expect(copyFeedbackLabel({ labels, state: "error" })).toBe("Copy failed");
  });

  it("uses the read-only label when supplied", () => {
    expect(
      copyFeedbackLabel({
        labels: { ...labels, readOnly: "Read only" },
        readOnly: true,
        state: "copied",
      }),
    ).toBe("Read only");
  });
});
