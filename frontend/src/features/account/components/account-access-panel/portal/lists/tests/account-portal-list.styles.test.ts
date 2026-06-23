import { describe, expect, it } from "vitest";
import {
  portalListClassName,
  portalListIconClassName,
  portalListRowClassName,
} from "../account-portal-list.styles";

describe("account portal list styles", () => {
  it("keeps reusable portal list row styles centralized", () => {
    expect(portalListClassName).toContain("account-trip-list");
    expect(portalListClassName).toContain("grid");
    expect(portalListRowClassName).toContain("account-trip-row");
    expect(portalListRowClassName).toContain("focus-visible:outline-none");
    expect(portalListRowClassName).toContain("max-[767px]:flex-wrap");
    expect(portalListIconClassName).toContain("account-trip-icon");
    expect(portalListIconClassName).toContain("bg-(--color-primary-soft)");
  });
});
