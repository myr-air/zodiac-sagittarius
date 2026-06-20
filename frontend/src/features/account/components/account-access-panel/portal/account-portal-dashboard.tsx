"use client";

import { useEffect, useState } from "react";
import type {
  AccountApiClient,
  AccountExplorerSummary,
  AccountSession,
  AccountSettings,
  AccountTodoSummary,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import type { PortalSection } from "@/src/shared/portal";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { AccountPortalDashboardClassNames } from "./account-portal-dashboard.types";
import {
  accountPortalNavSection,
  accountPortalSectionIndex,
  accountPortalSectionStorageKey,
  accountPortalTransitionDirection,
} from "./account-portal-dashboard-state";
import { AccountPortalNav } from "./account-portal-nav";
import { AccountPortalSectionContent } from "./account-portal-section-content";

interface AccountPortalDashboardProps {
  accountClient: AccountApiClient;
  apiClient?: TripApiClient;
  accountSession: AccountSession;
  classNames: AccountPortalDashboardClassNames;
  explorer: AccountExplorerSummary | null;
  isLoading: boolean;
  onCreatedTrip: (session: TripParticipantSession, options?: { openTrip?: boolean }) => Promise<void>;
  onError: (message: string | null) => void;
  onLogout: () => Promise<void>;
  onMessage: (message: string | null) => void;
  onSessionCleared: () => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  onVaultItemCreated: (item: AccountVaultItemSummary) => void;
  portalSection: PortalSection;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}

export function AccountPortalDashboard({
  accountClient,
  apiClient,
  accountSession,
  classNames,
  explorer,
  isLoading,
  onCreatedTrip,
  onError,
  onLogout,
  onSessionCleared,
  onMessage,
  onSettingsChanged,
  onVaultItemCreated,
  portalSection,
  settings,
  stats,
  todos,
  trips,
  vaultItems,
}: AccountPortalDashboardProps) {
  const { t } = useI18n();
  const [transitionDirection] = useState<"forward" | "back">(() => {
    return accountPortalTransitionDirection(
      portalSection,
      readPreviousPortalSectionIndex(accountPortalSectionIndex(portalSection)),
    );
  });

  const activePortalSection = accountPortalNavSection(portalSection);
  const currentPortalSectionIndex = accountPortalSectionIndex(portalSection);

  useEffect(() => {
    window.sessionStorage.setItem(accountPortalSectionStorageKey, String(currentPortalSectionIndex));
  }, [currentPortalSectionIndex]);

  return (
    <div className={classNames.dashboard} id="account-portal" data-transition-direction={transitionDirection}>
      <AccountPortalNav activeSection={activePortalSection} email={settings?.profile.primaryEmail ?? t.access.dashboard.noEmail} />

      <div className={classNames.portalContent}>
        <AccountPortalSectionContent
          accountClient={accountClient}
          accountSession={accountSession}
          apiClient={apiClient}
          classNames={classNames}
          explorer={explorer}
          isLoading={isLoading}
          portalSection={portalSection}
          settings={settings}
          stats={stats}
          todos={todos}
          trips={trips}
          vaultItems={vaultItems}
          onCreatedTrip={onCreatedTrip}
          onError={onError}
          onLogout={onLogout}
          onMessage={onMessage}
          onSessionCleared={onSessionCleared}
          onSettingsChanged={onSettingsChanged}
          onVaultItemCreated={onVaultItemCreated}
        />
      </div>
    </div>
  );
}

function readPreviousPortalSectionIndex(fallbackIndex: number): number {
  if (typeof window === "undefined") return fallbackIndex;
  const storedIndex = Number(window.sessionStorage.getItem(accountPortalSectionStorageKey));
  return Number.isFinite(storedIndex) ? storedIndex : fallbackIndex;
}
