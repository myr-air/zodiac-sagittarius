import { useState } from "react";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountTripCreateRequest,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import { errorMessage } from "../../auth";
import { defaultTripForm, normalizedTripForm } from "../../trip-wizard/model/account-trip-form";
import type { CreatedTripShare } from "../../trip-wizard/share/portal-created-trip-share";
import {
  buildPortalCreatedTripShare,
  resolvePortalCreatedTripInviteToken,
} from "./portal-new-trip-section-state";

interface UsePortalNewTripSectionActionsInput {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  apiClient?: TripApiClient;
  copyText: (text: string) => Promise<unknown>;
  defaultOwnerDisplayName: string;
  messages: Messages["access"];
  onCreatedTrip: (
    session: TripParticipantSession,
    options?: { openTrip?: boolean },
  ) => Promise<void>;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  resetCopyState: () => void;
  settings: AccountSettings | null;
}

export function usePortalNewTripSectionActions({
  accountClient,
  accountSession,
  apiClient,
  copyText,
  defaultOwnerDisplayName,
  messages,
  onCreatedTrip,
  onError,
  onMessage,
  resetCopyState,
  settings,
}: UsePortalNewTripSectionActionsInput) {
  const [tripForm, setTripForm] = useState(() =>
    defaultTripForm(settings?.profile.displayName, settings?.profile),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTripShare, setCreatedTripShare] =
    useState<CreatedTripShare | null>(null);

  async function submitTrip(overrideForm?: AccountTripCreateRequest) {
    setIsSubmitting(true);
    try {
      const normalizedForm = normalizedTripForm(
        overrideForm ?? tripForm,
        defaultOwnerDisplayName,
      );
      const response = await accountClient.createTrip(
        accountSession.sessionToken,
        normalizedForm,
      );
      const inviteToken = await resolvePortalCreatedTripInviteToken(
        apiClient,
        response,
      );
      setCreatedTripShare(buildPortalCreatedTripShare(response, inviteToken));
      resetCopyState();
      await onCreatedTrip(response.memberSession, { openTrip: false });
      setTripForm(
        defaultTripForm(settings?.profile.displayName, settings?.profile),
      );
      onMessage(messages.dashboard.createTrip.success);
      onError(null);
    } catch (caught) {
      onError(
        errorMessage(
          caught,
          messages.dashboard.createTrip.error,
          messages.messages,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyCreatedInviteLink() {
    if (!createdTripShare) return;
    await copyText(createdTripShare.inviteLink);
  }

  return {
    copyCreatedInviteLink,
    createdTripShare,
    isSubmitting,
    setTripForm,
    submitTrip,
    tripForm,
  };
}
