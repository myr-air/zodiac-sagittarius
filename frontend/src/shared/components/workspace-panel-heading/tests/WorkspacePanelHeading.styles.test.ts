import { describe, expect, it } from "vitest";
import {
  workspacePanelHeadingCompactClassName,
  workspacePanelHeadingOverviewClassName,
} from "../WorkspacePanelHeading.styles";

describe("WorkspacePanelHeading styles", () => {
  it("keeps compact panel headings dense and icon-aligned", () => {
    expect(workspacePanelHeadingCompactClassName).toContain("flex items-center gap-2");
    expect(workspacePanelHeadingCompactClassName).toContain("text-[14px]");
  });

  it("keeps overview icon color scoped to the icon", () => {
    expect(workspacePanelHeadingOverviewClassName).toContain("overview-panel-title");
    expect(workspacePanelHeadingOverviewClassName).toContain("[&_.icon]:text-(--color-primary-strong)");
  });
});
