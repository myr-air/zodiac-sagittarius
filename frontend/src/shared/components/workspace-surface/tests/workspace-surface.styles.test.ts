import { describe, expect, it } from "vitest";
import { workspaceResponsivePanelResetClassName } from "../workspace-surface.styles";

describe("workspace surface styles", () => {
  it("keeps responsive panel flattening in one shared class", () => {
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:rounded-none");
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:border-x-0");
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:border-t-0");
    expect(workspaceResponsivePanelResetClassName).toContain("max-[1199px]:shadow-none");
  });
});
