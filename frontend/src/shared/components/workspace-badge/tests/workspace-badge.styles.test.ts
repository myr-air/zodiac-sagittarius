import { describe, expect, it } from "vitest";
import { workspaceBadgeFrameClassName } from "../workspace-badge.styles";

describe("workspace badge styles", () => {
  it("keeps the shared workspace badge frame centralized", () => {
    expect(workspaceBadgeFrameClassName).toContain("inline-flex");
    expect(workspaceBadgeFrameClassName).toContain("min-h-6");
    expect(workspaceBadgeFrameClassName).toContain("rounded-full");
    expect(workspaceBadgeFrameClassName).toContain("text-[11px]");
    expect(workspaceBadgeFrameClassName).toContain("font-extrabold");
  });
});
