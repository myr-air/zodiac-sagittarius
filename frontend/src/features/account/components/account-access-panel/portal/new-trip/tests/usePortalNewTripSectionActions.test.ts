import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { messages } from "@/src/i18n/messages";
import {
  accountSettings,
  createAccountClient,
  createTrustedAccountSession,
  createTripApiClient,
} from "../../../testing/account-access-panel-test-clients";
import { defaultTripForm } from "../../../trip-wizard";
import { usePortalNewTripSectionActions } from "../usePortalNewTripSectionActions";

const defaultOwnerDisplayName = "Aom";

function createTripForm(): AccountTripCreateRequest {
  return {
    ...defaultTripForm(defaultOwnerDisplayName, accountSettings.profile),
    name: " Tokyo Spring ",
    destinationCities: [
      {
        city: " Tokyo ",
        country: " Japan ",
        countryCode: " jp ",
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: " Asia/Tokyo ",
      },
    ],
    joinId: " 0626-tyo-abc ",
    joinPassword: " spring ",
    ownerDisplayName: "",
  };
}

function createHook() {
  const accountClient = createAccountClient();
  const accountSession = createTrustedAccountSession();
  const apiClient = createTripApiClient();
  const copyText = vi.fn().mockResolvedValue(undefined);
  const onCreatedTrip = vi.fn().mockResolvedValue(undefined);
  const onError = vi.fn();
  const onMessage = vi.fn();
  const resetCopyState = vi.fn();
  const hook = renderHook(() =>
    usePortalNewTripSectionActions({
      accountClient,
      accountSession,
      apiClient,
      copyText,
      defaultOwnerDisplayName,
      messages: messages.en.access,
      onCreatedTrip,
      onError,
      onMessage,
      resetCopyState,
      settings: accountSettings,
    }),
  );

  return {
    ...hook,
    accountClient,
    accountSession,
    apiClient,
    copyText,
    onCreatedTrip,
    onError,
    onMessage,
    resetCopyState,
  };
}

describe("usePortalNewTripSectionActions", () => {
  it("creates a normalized trip, stores share details, and resets the form", async () => {
    const {
      accountClient,
      accountSession,
      apiClient,
      onCreatedTrip,
      onError,
      onMessage,
      resetCopyState,
      result,
    } = createHook();

    await act(async () => {
      await result.current.submitTrip(createTripForm());
    });

    expect(accountClient.createTrip).toHaveBeenCalledWith(
      accountSession.sessionToken,
      expect.objectContaining({
        name: "Tokyo Spring",
        destinationLabel: "Tokyo",
        ownerDisplayName: defaultOwnerDisplayName,
        joinId: "0626-TYO-ABC",
        joinPassword: "SPRING",
      }),
    );
    expect(apiClient.rotateJoinInviteToken).toHaveBeenCalledWith(
      "trip-created",
      "member-session",
    );
    expect(result.current.createdTripShare).toEqual({
      inviteLink: "http://localhost/join?token=created-token",
      joinId: "0626-TYO-ABC",
      name: "Tokyo Spring",
    });
    expect(resetCopyState).toHaveBeenCalledTimes(1);
    expect(onCreatedTrip).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: "member-session" }),
      { openTrip: false },
    );
    expect(onMessage).toHaveBeenCalledWith(
      messages.en.access.dashboard.createTrip.success,
    );
    expect(onError).toHaveBeenCalledWith(null);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.tripForm).toMatchObject({
      name: "",
      ownerDisplayName: defaultOwnerDisplayName,
    });
  });

  it("copies the created invite link only after a trip is created", async () => {
    const { copyText, result } = createHook();

    await act(async () => {
      await result.current.copyCreatedInviteLink();
    });
    expect(copyText).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.submitTrip(createTripForm());
    });
    await act(async () => {
      await result.current.copyCreatedInviteLink();
    });

    expect(copyText).toHaveBeenCalledWith(
      "http://localhost/join?token=created-token",
    );
  });

  it("reports create failures without storing a share", async () => {
    const { accountClient, onError, onMessage, resetCopyState, result } =
      createHook();
    vi.mocked(accountClient.createTrip).mockRejectedValueOnce(
      new Error("create failed"),
    );

    await act(async () => {
      await result.current.submitTrip(createTripForm());
    });

    expect(onError).toHaveBeenCalledWith(
      messages.en.access.dashboard.createTrip.error,
    );
    expect(result.current.createdTripShare).toBeNull();
    expect(resetCopyState).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });
});
