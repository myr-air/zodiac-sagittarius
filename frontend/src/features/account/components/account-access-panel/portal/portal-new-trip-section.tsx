"use client";

import Link from "next/link";
import type { AccountApiClient, AccountSession, AccountSettings } from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import { Badge, Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { useCopyFeedbackState } from "@/src/shared/components/copy-feedback";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  PortalCreatedTripShare,
  PortalTripWizard,
} from "../trip-wizard";
import { usePortalNewTripSectionActions } from "./usePortalNewTripSectionActions";

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
  const {
    copyText,
    hasCopied: hasCopiedCreatedInvite,
    resetCopyState,
  } = useCopyFeedbackState();
  const actions = usePortalNewTripSectionActions({
    accountClient,
    accountSession,
    apiClient,
    copyText,
    defaultOwnerDisplayName,
    messages: t.access,
    onCreatedTrip,
    onError,
    onMessage,
    resetCopyState,
    settings,
  });

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
      {actions.createdTripShare ? (
        <PortalCreatedTripShare
          copy={t.access.dashboard.createTrip.share}
          hasCopiedInvite={hasCopiedCreatedInvite}
          share={actions.createdTripShare}
          onCopyInvite={() => void actions.copyCreatedInviteLink()}
        />
      ) : null}
      <PortalTripWizard
        defaultOwnerDisplayName={defaultOwnerDisplayName}
        isSubmitting={actions.isSubmitting}
        tripForm={actions.tripForm}
        onChange={actions.setTripForm}
        onSubmit={actions.submitTrip}
      />
    </section>
  );
}
