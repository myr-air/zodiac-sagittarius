import type { FormEvent } from "react";
import { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AccountVaultItemCreateRequest } from "@/src/account/api-client";
import { messages } from "@/src/i18n/messages";
import {
  createAccountClient,
  createTrustedAccountSession,
} from "../../../testing/account-access-panel-test-clients";
import { createEmptyPortalVaultForm } from "../portal-vault-section-state";
import { usePortalVaultSectionActions } from "../usePortalVaultSectionActions";

const filledForm: AccountVaultItemCreateRequest = {
  kind: "file",
  title: " Tickets ",
  detail: " PDF link ",
  externalUrl: " https://example.test/tickets.pdf ",
};

function createHook(options: {
  initialForm?: AccountVaultItemCreateRequest;
} = {}) {
  const accountClient = createAccountClient();
  const accountSession = createTrustedAccountSession();
  const onError = vi.fn();
  const onMessage = vi.fn();
  const onVaultItemCreated = vi.fn();
  const hook = renderHook(() => {
    const [vaultForm, setVaultForm] = useState(
      options.initialForm ?? filledForm,
    );
    const actions = usePortalVaultSectionActions({
      accountClient,
      accountSession,
      messages: messages.en.access,
      onError,
      onMessage,
      onVaultItemCreated,
      setVaultForm,
      vaultForm,
    });

    return {
      ...actions,
      vaultForm,
    };
  });

  return {
    ...hook,
    accountClient,
    accountSession,
    onError,
    onMessage,
    onVaultItemCreated,
  };
}

async function submit(result: ReturnType<typeof createHook>["result"]) {
  const preventDefault = vi.fn();

  await act(async () => {
    await result.current.submitVaultItem({
      preventDefault,
    } as unknown as FormEvent<HTMLFormElement>);
  });

  return preventDefault;
}

describe("usePortalVaultSectionActions", () => {
  it("creates normalized vault items and resets the form", async () => {
    const {
      accountClient,
      accountSession,
      onError,
      onMessage,
      onVaultItemCreated,
      result,
    } = createHook();
    const preventDefault = await submit(result);

    await vi.waitFor(() => {
      expect(accountClient.createVaultItem).toHaveBeenCalledWith(
        accountSession.sessionToken,
        {
          kind: "file",
          title: "Tickets",
          detail: "PDF link",
          externalUrl: "https://example.test/tickets.pdf",
        },
      );
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onVaultItemCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: "vault-created" }),
    );
    expect(onMessage).toHaveBeenCalledWith(
      messages.en.access.portal.vaultCreate.success,
    );
    expect(onError).toHaveBeenCalledWith(null);
    expect(result.current.vaultForm).toEqual(createEmptyPortalVaultForm());
  });

  it("does not submit blank vault titles", async () => {
    const { accountClient, onError, onMessage, onVaultItemCreated, result } =
      createHook({
        initialForm: {
          ...filledForm,
          title: "   ",
        },
      });

    await submit(result);

    expect(accountClient.createVaultItem).not.toHaveBeenCalled();
    expect(onVaultItemCreated).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports create failures without resetting the form", async () => {
    const { accountClient, onError, result } = createHook();
    vi.mocked(accountClient.createVaultItem).mockRejectedValueOnce(
      new Error("vault failed"),
    );

    await submit(result);

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        messages.en.access.portal.vaultCreate.error,
      );
    });
    expect(result.current.vaultForm).toEqual(filledForm);
  });
});
