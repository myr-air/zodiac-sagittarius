import type {
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import {
  buildSelectOptions,
  type SelectOption,
} from "@/src/shared/select-options";
import { trimmedTextOrNull } from "@/src/shared/text-parts";
import type { IconName } from "@/src/ui/icons";

export const portalVaultCloudProviders = ["Google Drive", "iCloud", "Dropbox", "OneDrive"] as const;
type PortalVaultKind = AccountVaultItemCreateRequest["kind"];

export const portalVaultKindValues = ["note", "file"] as const satisfies readonly PortalVaultKind[];

export type PortalVaultKindSelectOption = SelectOption<PortalVaultKind>;

export interface PortalVaultItemRow {
  badgeLabel: string;
  badgeTone: ReturnType<typeof portalVaultItemBadgeTone>;
  detail: string;
  icon: IconName;
  id: string;
  title: string;
}

export function portalVaultKindSelectOptions(labels: {
  file: string;
  note: string;
}): PortalVaultKindSelectOption[] {
  return buildSelectOptions(portalVaultKindValues, (value) => labels[value]);
}

export function createEmptyPortalVaultForm(): AccountVaultItemCreateRequest {
  return { kind: "note", title: "", detail: "", externalUrl: "" };
}

export function buildPortalVaultCreateRequest(
  vaultForm: AccountVaultItemCreateRequest,
): AccountVaultItemCreateRequest | null {
  const title = vaultForm.title.trim();
  if (!title) return null;

  return {
    ...vaultForm,
    title,
    detail: vaultForm.detail.trim(),
    externalUrl: trimmedTextOrNull(vaultForm.externalUrl),
  };
}

export function portalVaultItemIcon(item: AccountVaultItemSummary): IconName {
  return item.kind === "file" ? "document" : "note";
}

export function portalVaultItemDetail(
  item: AccountVaultItemSummary,
  personalLabel: string,
): string {
  return `${item.tripName ?? personalLabel} · ${item.detail}`;
}

export function portalVaultItemBadgeTone(
  item: AccountVaultItemSummary,
): "neutral" | "success" {
  return item.kind === "file" ? "neutral" : "success";
}

export function buildPortalVaultItemRows(
  vaultItems: readonly AccountVaultItemSummary[],
  labels: { personal: string },
): PortalVaultItemRow[] {
  return vaultItems.map((item) => ({
    badgeLabel: item.kind,
    badgeTone: portalVaultItemBadgeTone(item),
    detail: portalVaultItemDetail(item, labels.personal),
    icon: portalVaultItemIcon(item),
    id: `${item.source}-${item.id}`,
    title: item.title,
  }));
}
