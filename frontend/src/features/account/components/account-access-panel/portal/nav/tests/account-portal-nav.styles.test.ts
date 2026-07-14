import { describe, expect, it } from "vitest";
import {
  portalNavBrandClassName,
  portalNavClassName,
  portalNavLinkActiveClassName,
  portalNavLinkClassName,
  portalNavLinksClassName,
} from "../account-portal-nav.styles";

describe("account portal nav styles", () => {
  it("keeps portal nav layout and active link styles centralized", () => {
    expect(portalNavClassName).toContain("portal-nav");
    expect(portalNavClassName).toContain("sticky");
    expect(portalNavBrandClassName).toContain("portal-nav-brand");
    expect(portalNavBrandClassName).toContain("text-ellipsis");
    expect(portalNavLinksClassName).toContain("portal-nav-links");
    expect(portalNavLinksClassName).toContain("overflow-x-auto");
    expect(portalNavLinkClassName).toContain("portal-nav-link");
    expect(portalNavLinkClassName).toContain("focus-visible:border-(--color-primary-border)");
    expect(portalNavLinkActiveClassName).toContain("portal-nav-link--active");
    expect(portalNavLinkActiveClassName).toContain("bg-(--color-primary-soft)");
  });
});
