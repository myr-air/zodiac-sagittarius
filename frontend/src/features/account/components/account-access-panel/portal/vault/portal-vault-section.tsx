"use client";

import { useState } from "react";
import type {
  AccountApiClient,
  AccountSession,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import { SelectOptions } from "@/src/shared/components/select-options";
import { Badge, Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { PortalList, PortalListRow } from "../lists/account-portal-list";
import { PanelHeading } from "../../primitives/account-panel-heading";
import { PortalListSkeleton } from "../primitives/account-portal-primitives";
import { PortalVaultCloudProviderPanel } from "./portal-vault-cloud-provider-panel";
import {
  buildPortalVaultItemRows,
  createEmptyPortalVaultForm,
  portalVaultKindSelectOptions,
} from "./portal-vault-section-state";
import { usePortalVaultSectionActions } from "./usePortalVaultSectionActions";

interface PortalVaultSectionClassNames {
  empty: string;
  form: string;
  section: string;
  twoCol: string;
}

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
  const [vaultForm, setVaultForm] = useState<AccountVaultItemCreateRequest>(
    createEmptyPortalVaultForm,
  );
  const actions = usePortalVaultSectionActions({
    accountClient,
    accountSession,
    messages: t.access,
    onError,
    onMessage,
    onVaultItemCreated,
    setVaultForm,
    vaultForm,
  });
  const vaultRows = buildPortalVaultItemRows(vaultItems, {
    personal: t.access.portal.vaultCreate.personal,
  });

  return (
    <section className={classNames.section} id="portal-vault">
      <PanelHeading icon="document" title={t.access.portal.sections.vault.title} detail={t.access.portal.sections.vault.detail} />
      <PortalVaultCloudProviderPanel />
      <form className={classNames.form} onSubmit={actions.submitVaultItem}>
        <div className={classNames.twoCol}>
          <label>
            <span>{t.access.portal.vaultCreate.kind}</span>
            <Select value={vaultForm.kind} onChange={(event) => setVaultForm((current) => ({ ...current, kind: event.target.value as "note" | "file" }))}>
              <SelectOptions
                options={portalVaultKindSelectOptions(t.access.portal.vaultCreate)}
              />
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
          {vaultRows.map((item) => (
            <PortalListRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              detail={item.detail}
              badge={<Badge tone={item.badgeTone}>{item.badgeLabel}</Badge>}
              action={item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  <Icon name="external" />
                  <span>Open</span>
                </a>
              ) : undefined}
            />
          ))}
        </PortalList>
      ) : (
        <p className={classNames.empty}>{t.access.portal.sections.vault.empty}</p>
      )}
    </section>
  );
}
