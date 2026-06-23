import type { PortalSection } from "@/src/shared/portal";

export const accountPortalSectionOrder: readonly PortalSection[] = [
  "dashboard",
  "trips",
  "new-trip",
  "explorer",
  "todos",
  "vault",
  "settings",
  "sign-out",
];

export const accountPortalSectionStorageKey = "sagittarius:portal-section-index";

export function accountPortalNavSection(portalSection: PortalSection): PortalSection {
  return portalSection === "new-trip" ? "trips" : portalSection;
}

export function accountPortalSectionIndex(portalSection: PortalSection): number {
  return accountPortalSectionOrder.indexOf(portalSection);
}

export function accountPortalTransitionDirection(
  portalSection: PortalSection,
  previousSectionIndex: number,
): "forward" | "back" {
  return accountPortalSectionIndex(portalSection) < previousSectionIndex ? "back" : "forward";
}
