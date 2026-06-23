import type {
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import type { IconName } from "@/src/ui/icons";

export const portalVaultCloudProviders = ["Google Drive", "iCloud", "Dropbox", "OneDrive"] as const;

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
    externalUrl: vaultForm.externalUrl?.trim() || null,
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
