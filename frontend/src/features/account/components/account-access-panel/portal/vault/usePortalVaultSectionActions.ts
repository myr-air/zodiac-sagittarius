import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  AccountApiClient,
  AccountSession,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import { errorMessage } from "../../auth";
import {
  buildPortalVaultCreateRequest,
  createEmptyPortalVaultForm,
} from "./portal-vault-section-state";

interface UsePortalVaultSectionActionsInput {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  messages: Messages["access"];
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onVaultItemCreated: (item: AccountVaultItemSummary) => void;
  setVaultForm: Dispatch<SetStateAction<AccountVaultItemCreateRequest>>;
  vaultForm: AccountVaultItemCreateRequest;
}

export function usePortalVaultSectionActions({
  accountClient,
  accountSession,
  messages,
  onError,
  onMessage,
  onVaultItemCreated,
  setVaultForm,
  vaultForm,
}: UsePortalVaultSectionActionsInput) {
  async function submitVaultItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const vaultRequest = buildPortalVaultCreateRequest(vaultForm);
    if (!vaultRequest) return;

    try {
      const item = await accountClient.createVaultItem(
        accountSession.sessionToken,
        vaultRequest,
      );
      onVaultItemCreated(item);
      setVaultForm(createEmptyPortalVaultForm());
      onMessage(messages.portal.vaultCreate.success);
      onError(null);
    } catch (caught) {
      onError(
        errorMessage(
          caught,
          messages.portal.vaultCreate.error,
          messages.messages,
        ),
      );
    }
  }

  return {
    submitVaultItem,
  };
}
