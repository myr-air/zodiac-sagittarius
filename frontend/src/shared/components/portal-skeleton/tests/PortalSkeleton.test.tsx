import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PortalSkeleton,
  portalSkeletonClassName,
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
});
