import { describe, expect, it } from "vitest";
import {
  accountMetricLineClassName,
  accountSettingLineClassName,
  accountStatClassName,
  portalEmptyStateClassName,
  portalListSkeletonClassName,
  portalSkeletonCardClassName,
  portalSkeletonRowClassName,
} from "../account-portal-primitives.styles";

describe("account portal primitive styles", () => {
  it("keeps portal primitive class names centralized", () => {
    expect(accountMetricLineClassName).toContain("rounded-(--radius-md)");
    expect(accountStatClassName).toContain("account-stat");
    expect(accountStatClassName).toContain("[&_strong]:text-2xl");
    expect(accountSettingLineClassName).toContain("account-setting-line");
    expect(portalSkeletonCardClassName).toContain("portal-skeleton-card");
    expect(portalListSkeletonClassName).toContain("portal-list-skeleton");
    expect(portalSkeletonRowClassName).toContain("portal-skeleton-row");
    expect(portalEmptyStateClassName).toContain("portal-empty-state");
    expect(portalEmptyStateClassName).toContain("border-dashed");
  });
});
