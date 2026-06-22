import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PortalSkeleton,
  portalSkeletonBlockClassName,
  portalSkeletonClassName,
  portalSkeletonLineClassName,
  portalSkeletonTitleClassName,
  portalSkeletonVariantValues,
} from "../PortalSkeleton";

describe("PortalSkeleton", () => {
  it("renders each skeleton variant with the shared animated base class", () => {
    for (const variant of portalSkeletonVariantValues) {
      render(<PortalSkeleton aria-label={`${variant} skeleton`} variant={variant} />);

      const skeleton = screen.getByLabelText(`${variant} skeleton`);
      expect(skeleton).toHaveClass("portal-skeleton");
      expect(skeleton).toHaveClass(`portal-skeleton--${variant}`);
    }
  });

  it("composes caller classes without dropping variant classes", () => {
    expect(portalSkeletonClassName("line", "extra-class")).toContain(
      "portal-skeleton--line h-4",
    );
    expect(portalSkeletonClassName("line", "extra-class")).toContain("extra-class");
  });

  it("exports shared loading-frame skeleton class names from the shared module", () => {
    expect(portalSkeletonTitleClassName).toContain("portal-skeleton--title");
    expect(portalSkeletonLineClassName).toContain("portal-skeleton--line");
    expect(portalSkeletonBlockClassName).toContain("portal-skeleton--block");
  });
});
