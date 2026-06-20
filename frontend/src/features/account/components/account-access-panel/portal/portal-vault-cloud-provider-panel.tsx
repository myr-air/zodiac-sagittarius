"use client";

import { Icon } from "@/src/ui/icons";
import { portalVaultCloudProviders } from "./portal-vault-section-state";

const cloudProviderPanelClassName = "cloud-provider-panel grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
const cloudProviderGridClassName = "cloud-provider-grid grid grid-cols-4 gap-2 max-[767px]:grid-cols-2";
const cloudProviderButtonClassName = "cloud-provider-button inline-flex min-h-[46px] items-center justify-center gap-2 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) text-xs font-[850] text-(--color-text) transition-[border-color,background,color] duration-[180ms] hover:border-(--color-primary) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) focus-visible:border-(--color-primary) focus-visible:bg-(--color-primary-soft) focus-visible:text-(--color-primary-strong) disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:hover:border-(--color-border) disabled:hover:bg-(--color-surface-muted) disabled:hover:text-(--color-text-muted)";

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
