import { describe, expect, it } from "vitest";
import {
  portalSkeletonBaseClassName,
  portalSkeletonBlockClassName,
  portalSkeletonClassName,
  portalSkeletonVariantClassNames,
  portalSkeletonVariantValues,
} from "../PortalSkeleton.styles";

describe("PortalSkeleton styles", () => {
  it("keeps skeleton animation and variants centralized", () => {
    expect(portalSkeletonVariantValues).toEqual([
      "title",
      "line",
      "block",
      "number",
      "short",
      "icon",
    ]);
    expect(portalSkeletonBaseClassName).toContain("portal-skeleton");
    expect(portalSkeletonBaseClassName).toContain("motion-reduce:animate-none");
    expect(portalSkeletonVariantClassNames.title).toContain("portal-skeleton--title");
    expect(portalSkeletonVariantClassNames.icon).toContain("portal-skeleton--icon");
    expect(portalSkeletonClassName("line", "extra")).toContain("extra");
    expect(portalSkeletonBlockClassName).toContain("portal-skeleton--block");
  });
});
