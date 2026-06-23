import { describe, expect, it } from "vitest";
import {
  workspaceSummaryGridFiveClassName,
  workspaceSummaryGridFourClassName,
  workspaceSummaryStatPrimaryAccentClassName,
  workspaceSummaryStatRouteAccentClassName,
  workspaceSummaryStatSurfaceClassName,
  workspaceSummaryStatValueFirstClassName,
} from "../WorkspaceSummaryStat.styles";

describe("WorkspaceSummaryStat styles", () => {
  it("keeps shared summary grid variants centralized", () => {
    expect(workspaceSummaryGridFourClassName).toContain("grid-cols-4");
    expect(workspaceSummaryGridFourClassName).toContain("max-[767px]:grid-cols-1");
    expect(workspaceSummaryGridFiveClassName).toContain("grid-cols-5");
    expect(workspaceSummaryGridFiveClassName).toContain("max-[1199px]:grid-cols-3");
  });

  it("keeps shared summary card variants on the common stat recipe", () => {
    expect(workspaceSummaryStatSurfaceClassName).toContain("rounded-(--radius-md)");
    expect(workspaceSummaryStatSurfaceClassName).toContain("[&_.icon]:text-(--color-primary)");
    expect(workspaceSummaryStatPrimaryAccentClassName).toContain("color-mix(in_srgb,var(--color-primary-soft)");
    expect(workspaceSummaryStatRouteAccentClassName).toContain("color-mix(in_srgb,var(--color-route-border)");
    expect(workspaceSummaryStatValueFirstClassName).toContain("content-center");
  });
});
