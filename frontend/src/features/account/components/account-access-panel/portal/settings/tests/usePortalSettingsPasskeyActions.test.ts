import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "@/src/i18n/messages";
import {
  accountSettings,
  createAccountClient,
  createTrustedAccountSession,
} from "../../../testing/account-access-panel-test-clients";
import {
  bytes,
  stubCredentials,
} from "../../../testing/account-access-panel-passkey-test-utils";
import { usePortalSettingsPasskeyActions } from "../usePortalSettingsPasskeyActions";

function createHook(options: { settings?: typeof accountSettings | null } = {}) {
  const accountClient = createAccountClient();
  const accountSession = createTrustedAccountSession();
  const onError = vi.fn();
  const onMessage = vi.fn();
  const onSettingsChanged = vi.fn();
  const hook = renderHook(() =>
    usePortalSettingsPasskeyActions({
      accountClient,
      accountSession,
      labels: messages.en.access,
      onError,
      onMessage,
      onSettingsChanged,
      settings: options.settings === undefined ? accountSettings : options.settings,
    }),
  );

  return {
    ...hook,
    accountClient,
    accountSession,
    onError,
    onMessage,
    onSettingsChanged,
  };
}

describe("usePortalSettingsPasskeyActions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a browser passkey and prepends it to settings", async () => {
    const credentials = stubCredentials();
    const {
      accountClient,
      accountSession,
      onError,
      onMessage,
      onSettingsChanged,
      result,
    } = createHook();

    await act(async () => {
      await result.current.registerPasskey();
    });

    expect(accountClient.startPasskeyRegistration).toHaveBeenCalledWith(
      accountSession.sessionToken,
    );
    expect(credentials.create).toHaveBeenCalledWith({
      publicKey: expect.objectContaining({
        challenge: bytes([1, 2, 3, 4]),
        user: expect.objectContaining({
          displayName: "Aom",
          name: "aom@example.test",
        }),
      }),
    });
    expect(accountClient.finishPasskeyRegistration).toHaveBeenCalledWith(
      accountSession.sessionToken,
      {
        challengeId: "passkey-challenge",
        credentialId: "BQYH",
        clientDataJson: "CAk",
        attestationObject: "CgsM",
        nickname: "Aom passkey",
      },
    );
    expect(onSettingsChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        passkeys: [expect.objectContaining({ id: "passkey-id" })],
      }),
    );
    expect(onMessage).toHaveBeenCalledWith(
      messages.en.access.settings.messages.passkeyCreated,
    );
    expect(onError).toHaveBeenCalledWith(null);
  });

  it("does nothing when settings are not loaded", async () => {
    const { accountClient, onError, onMessage, onSettingsChanged, result } =
      createHook({ settings: null });

    await act(async () => {
      await result.current.registerPasskey();
    });

    expect(accountClient.startPasskeyRegistration).not.toHaveBeenCalled();
    expect(onSettingsChanged).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports passkey registration failures", async () => {
    const { accountClient, onError, onMessage, onSettingsChanged, result } =
      createHook();
    vi.mocked(accountClient.startPasskeyRegistration).mockRejectedValueOnce(
      new Error("registration failed"),
    );

    await act(async () => {
      await result.current.registerPasskey();
    });

    expect(onError).toHaveBeenCalledWith(
      messages.en.access.settings.messages.passkeyFailed,
    );
    expect(onSettingsChanged).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
  });
});
