"use client";

import { Icon } from "@/src/ui/icons";
import { portalVaultCloudProviders } from "./portal-vault-section-state";
import {
  cloudProviderButtonClassName,
  cloudProviderGridClassName,
  cloudProviderPanelClassName,
} from "./portal-vault-cloud-provider-panel.styles";

export function PortalVaultCloudProviderPanel() {
  return (
    <div className={cloudProviderPanelClassName} aria-label="Cloud provider options">
      <div>
        <strong>Use your own cloud</strong>
        <span id="cloud-provider-status">Link paste only for now. Save a provider URL in the external link field; direct cloud connection is not enabled yet.</span>
      </div>
      <div className={cloudProviderGridClassName}>
        {portalVaultCloudProviders.map((provider) => (
          <button
            aria-describedby="cloud-provider-status"
            className={cloudProviderButtonClassName}
            disabled
            type="button"
            key={provider}
          >
            <Icon name="cloud" />
            {provider}
            <span className="sr-only">link paste only</span>
          </button>
        ))}
      </div>
    </div>
  );
}
