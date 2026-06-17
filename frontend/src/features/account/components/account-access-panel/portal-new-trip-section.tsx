"use client";

import { useState } from "react";
import Link from "next/link";
import type { AccountApiClient, AccountSession, AccountSettings, AccountTripCreateRequest } from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import { Badge, Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { errorMessage } from "./account-auth-support";
import { buildInviteLink, defaultTripForm, normalizedTripForm } from "./account-trip-wizard-support";
import { PortalCreatedTripShare, type CreatedTripShare } from "./portal-created-trip-share";
import { PortalTripWizard } from "./portal-trip-wizard";

interface PortalNewTripSectionClassNames {
  card: string;
  historyCard: string;
  topbar: string;
}

export function PortalNewTripSection({
  accountClient,
  accountSession,
  apiClient,
  classNames,
  onCreatedTrip,
  onError,
  onMessage,
  settings,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  apiClient?: TripApiClient;
  classNames: PortalNewTripSectionClassNames;
  onCreatedTrip: (session: TripParticipantSession, options?: { openTrip?: boolean }) => Promise<void>;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  settings: AccountSettings | null;
}) {
  const { t } = useI18n();
  const defaultOwnerDisplayName = settings?.profile.displayName ?? t.access.dashboard.fallbackName;
  const [tripForm, setTripForm] = useState(() => defaultTripForm(settings?.profile.displayName, settings?.profile));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTripShare, setCreatedTripShare] = useState<CreatedTripShare | null>(null);
  const [hasCopiedCreatedInvite, setHasCopiedCreatedInvite] = useState(false);

  async function submitTrip(overrideForm?: AccountTripCreateRequest) {
    setIsSubmitting(true);
    try {
      const normalizedForm = normalizedTripForm(overrideForm ?? tripForm, defaultOwnerDisplayName);
      const response = await accountClient.createTrip(accountSession.sessionToken, normalizedForm);
      let inviteToken: string | null = null;
      try {
        const invite = await apiClient?.rotateJoinInviteToken?.(response.trip.id, response.memberSession.sessionToken);
        inviteToken = invite?.token ?? null;
      } catch {
        inviteToken = null;
      }
      setCreatedTripShare({
        inviteLink: buildInviteLink(response.trip.joinId, inviteToken),
        joinId: response.trip.joinId,
        name: response.trip.name,
      });
      setHasCopiedCreatedInvite(false);
      await onCreatedTrip(response.memberSession, { openTrip: false });
      setTripForm(defaultTripForm(settings?.profile.displayName, settings?.profile));
      onMessage(t.access.dashboard.createTrip.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.dashboard.createTrip.error, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyCreatedInviteLink() {
    if (!createdTripShare) return;
    try {
      await navigator.clipboard?.writeText(createdTripShare.inviteLink);
      setHasCopiedCreatedInvite(true);
    } catch {
      setHasCopiedCreatedInvite(false);
    }
  }

  return (
    <section className={cn(classNames.historyCard, classNames.card)} id="portal-new-trip">
      <div className={classNames.topbar} style={{ position: "relative", zIndex: 100 }}>
        <Button asChild variant="secondary">
          <Link href={appRoutes.portalMyTrips()}>
            <Icon name="chevronLeft" />
            {t.access.portal.nav.trips}
          </Link>
        </Button>
        <div className="trip-builder-title">
          <span>{t.access.dashboard.createTrip.wizard.builderLabel}</span>
          <strong>{t.access.dashboard.createTrip.wizard.title}</strong>
          <small>{t.access.dashboard.createTrip.wizard.detail}</small>
        </div>
        <div className="relative grid justify-items-end gap-2" style={{ zIndex: 80 }}>
          <LanguageSwitch className="relative !m-0 !w-fit" style={{ zIndex: 80 }} />
          <Badge tone="neutral">{t.access.dashboard.createTrip.wizard.statusDraft}</Badge>
        </div>
      </div>
      {createdTripShare ? (
        <PortalCreatedTripShare
          hasCopiedInvite={hasCopiedCreatedInvite}
          share={createdTripShare}
          onCopyInvite={() => void copyCreatedInviteLink()}
        />
      ) : null}
      <PortalTripWizard
        defaultOwnerDisplayName={defaultOwnerDisplayName}
        isSubmitting={isSubmitting}
        tripForm={tripForm}
        onChange={setTripForm}
        onSubmit={submitTrip}
      />
    </section>
  );
}
