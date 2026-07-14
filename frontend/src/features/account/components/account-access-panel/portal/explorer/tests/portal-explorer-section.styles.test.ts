import { describe, expect, it } from "vitest";
import {
  portalMapPinClassName,
  portalMapPreviewClassName,
  portalSearchClassName,
} from "../portal-explorer-section.styles";

describe("portal explorer section styles", () => {
  it("keeps explorer search and map preview styles centralized", () => {
    expect(portalSearchClassName).toContain("portal-search");
    expect(portalSearchClassName).toContain("grid-cols-[20px_minmax(0,1fr)]");
    expect(portalSearchClassName).toContain("[&_input]:outline-0");
    expect(portalMapPreviewClassName).toContain("portal-map-preview");
    expect(portalMapPreviewClassName).toContain("max-[767px]:min-h-[220px]");
    expect(portalMapPinClassName).toContain("portal-map-pin");
    expect(portalMapPinClassName).toContain("left-[var(--pin-x)]");
    expect(portalMapPinClassName).toContain("top-[var(--pin-y)]");
  });
});
