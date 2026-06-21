import { describe, expect, it } from "vitest";
import {
  workspaceResponsiveInlinePanelResetClassName,
  workspaceResponsivePanelResetClassName,
} from "../workspace-surface.styles";

describe("workspace surface styles", () => {
  it("keeps responsive panel flattening in one shared class", () => {
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:rounded-none");
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:border-x-0");
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:border-t-0");
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:shadow-none");
  });

  it("keeps inline responsive panel flattening in one shared class", () => {
    expect(workspaceResponsiveInlinePanelResetClassName).toContain("max-[1199px]:rounded-none");
    expect(workspaceResponsiveInlinePanelResetClassName).toContain("max-[1199px]:border-x-0");
    expect(workspaceResponsiveInlinePanelResetClassName).not.toContain("max-[1199px]:border-t-0");
    expect(workspaceResponsiveInlinePanelResetClassName).toContain("max-[1199px]:shadow-none");
  });
});
