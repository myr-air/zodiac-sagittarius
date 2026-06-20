"use client";

import { FormEvent, useState } from "react";
import type {
  AccountApiClient,
  AccountSession,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import { Badge, Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { errorMessage } from "../auth";
import { PortalList, PortalListRow } from "./account-portal-list";
import { PanelHeading } from "../account-panel-heading";
import { PortalListSkeleton } from "./account-portal-primitives";
import {
  buildPortalVaultCreateRequest,
  createEmptyPortalVaultForm,
  portalVaultCloudProviders,
} from "./portal-vault-section-state";

interface PortalVaultSectionClassNames {
  empty: string;
  form: string;
  section: string;
  twoCol: string;
}

const cloudProviderPanelClassName = "cloud-provider-panel grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
const cloudProviderGridClassName = "cloud-provider-grid grid grid-cols-4 gap-2 max-[767px]:grid-cols-2";
const cloudProviderButtonClassName = "cloud-provider-button inline-flex min-h-[46px] items-center justify-center gap-2 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) text-xs font-[850] text-(--color-text) transition-[border-color,background,color] duration-[180ms] hover:border-(--color-primary) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) focus-visible:border-(--color-primary) focus-visible:bg-(--color-primary-soft) focus-visible:text-(--color-primary-strong) disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:hover:border-(--color-border) disabled:hover:bg-(--color-surface-muted) disabled:hover:text-(--color-text-muted)";

export function PortalVaultSection({
  accountClient,
  accountSession,
  classNames,
  isLoading,
  onError,
  onMessage,
  onVaultItemCreated,
  vaultItems,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  classNames: PortalVaultSectionClassNames;
  isLoading: boolean;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onVaultItemCreated: (item: AccountVaultItemSummary) => void;
  vaultItems: AccountVaultItemSummary[];
}) {
  const { t } = useI18n();
  const [vaultForm, setVaultForm] = useState<AccountVaultItemCreateRequest>(createEmptyPortalVaultForm);

  async function submitVaultItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const vaultRequest = buildPortalVaultCreateRequest(vaultForm);
    if (!vaultRequest) return;

    try {
      const item = await accountClient.createVaultItem(accountSession.sessionToken, vaultRequest);
      onVaultItemCreated(item);
      setVaultForm(createEmptyPortalVaultForm());
      onMessage(t.access.portal.vaultCreate.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.portal.vaultCreate.error, t.access.messages));
    }
  }

  return (
    <section className={classNames.section} id="portal-vault">
      <PanelHeading icon="document" title={t.access.portal.sections.vault.title} detail={t.access.portal.sections.vault.detail} />
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
      <form className={classNames.form} onSubmit={submitVaultItem}>
        <div className={classNames.twoCol}>
          <label>
            <span>{t.access.portal.vaultCreate.kind}</span>
            <Select value={vaultForm.kind} onChange={(event) => setVaultForm((current) => ({ ...current, kind: event.target.value as "note" | "file" }))}>
              <option value="note">{t.access.portal.vaultCreate.note}</option>
              <option value="file">{t.access.portal.vaultCreate.file}</option>
            </Select>
          </label>
          <label>
            <span>{t.access.portal.vaultCreate.title}</span>
            <input value={vaultForm.title} onChange={(event) => setVaultForm((current) => ({ ...current, title: event.target.value }))} required />
          </label>
        </div>
        <label>
          <span>{t.access.portal.vaultCreate.detail}</span>
          <input value={vaultForm.detail} onChange={(event) => setVaultForm((current) => ({ ...current, detail: event.target.value }))} />
        </label>
        <label>
          <span>{t.access.portal.vaultCreate.externalUrl}</span>
          <input
            value={vaultForm.externalUrl ?? ""}
            onChange={(event) => setVaultForm((current) => ({ ...current, externalUrl: event.target.value }))}
            placeholder="https://drive.google.com/..."
            type="url"
          />
        </label>
        <Button type="submit"><Icon name="plus" />{t.access.portal.vaultCreate.submit}</Button>
      </form>
      {isLoading && !vaultItems.length ? (
        <PortalListSkeleton rows={1} />
      ) : vaultItems.length ? (
        <PortalList>
          {vaultItems.map((item) => (
            <PortalListRow
              key={`${item.source}-${item.id}`}
              icon={item.kind === "file" ? "document" : "note"}
              title={item.title}
              detail={`${item.tripName ?? t.access.portal.vaultCreate.personal} · ${item.detail}`}
              badge={<Badge tone={item.kind === "file" ? "neutral" : "success"}>{item.kind}</Badge>}
            />
          ))}
        </PortalList>
      ) : (
        <p className={classNames.empty}>{t.access.portal.sections.vault.empty}</p>
      )}
    </section>
  );
}
