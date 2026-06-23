import { describe, expect, it } from "vitest";
import {
  cloudProviderButtonClassName,
  cloudProviderGridClassName,
  cloudProviderPanelClassName,
} from "../portal-vault-cloud-provider-panel.styles";

describe("portal vault cloud provider panel styles", () => {
  it("keeps disabled cloud provider affordance styles centralized", () => {
    expect(cloudProviderPanelClassName).toContain("cloud-provider-panel");
    expect(cloudProviderPanelClassName).toContain("bg-(--color-surface-subtle)");
    expect(cloudProviderGridClassName).toContain("cloud-provider-grid");
    expect(cloudProviderGridClassName).toContain("max-[767px]:grid-cols-2");
    expect(cloudProviderButtonClassName).toContain("cloud-provider-button");
    expect(cloudProviderButtonClassName).toContain("disabled:cursor-not-allowed");
    expect(cloudProviderButtonClassName).toContain("disabled:bg-(--color-surface-muted)");
  });
});
