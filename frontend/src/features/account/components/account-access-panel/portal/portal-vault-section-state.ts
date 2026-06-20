import type { AccountVaultItemCreateRequest } from "@/src/account/api-client";

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
