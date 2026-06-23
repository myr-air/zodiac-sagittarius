import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { portalVaultCloudProviders } from "../portal-vault-section-state";
import { PortalVaultCloudProviderPanel } from "../portal-vault-cloud-provider-panel";

describe("portal vault cloud provider panel", () => {
  it("renders supported cloud providers as disabled link-paste-only options", () => {
    render(<PortalVaultCloudProviderPanel />);

    const panel = screen.getByLabelText("Cloud provider options");
    expect(panel).toHaveClass("cloud-provider-panel");
    expect(within(panel).getByText("Use your own cloud")).toBeVisible();
    expect(screen.getByText(/Link paste only for now/i)).toHaveAttribute(
      "id",
      "cloud-provider-status",
    );

    for (const provider of portalVaultCloudProviders) {
      const providerButton = screen.getByRole("button", {
        name: new RegExp(`${provider}.*link paste only`, "i"),
      });
      expect(providerButton).toBeDisabled();
      expect(providerButton).toHaveClass("cloud-provider-button");
      expect(providerButton).toHaveAttribute(
        "aria-describedby",
        "cloud-provider-status",
      );
    }
  });
});
