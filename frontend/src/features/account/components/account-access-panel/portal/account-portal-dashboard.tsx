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
import { AccountPortalNav } from "./account-portal-nav";
import { PortalDashboardSection } from "./portal-dashboard-section";
import { PortalExplorerSection } from "./portal-explorer-section";
import { PortalNewTripSection } from "./portal-new-trip-section";
import { PortalSettingsSection } from "./portal-settings-section";
import { PortalSignOutSection } from "./portal-sign-out-section";
import { PortalTodosSection } from "./portal-todos-section";
import { PortalTripsSection } from "./portal-trips-section";
import { PortalVaultSection } from "./portal-vault-section";

interface AccountPortalDashboardClassNames {
  avatar: string;
  dashboard: string;
  deviceList: string;
  deviceRow: string;
  empty: string;
  featureCard: string;
  historyCard: string;
  newTripCard: string;
  portalContent: string;
  profileCard: string;
  profileRow: string;
  sectionTopline: string;
  settingsCard: string;
  settingsForm: string;
  settingsGrid: string;
  settingsProfilePreview: string;
  statGrid: string;
  stepSummary: string;
  tripBuilderTopbar: string;
  twoCol: string;
}

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

const portalSectionOrder: PortalSection[] = ["dashboard", "trips", "new-trip", "explorer", "todos", "vault", "settings", "sign-out"];
const portalSectionStorageKey = "sagittarius:portal-section-index";

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
    const currentIndex = portalSectionOrder.indexOf(portalSection);
    return currentIndex < readPreviousPortalSectionIndex(currentIndex) ? "back" : "forward";
  });

  const activePortalSection = portalSection === "new-trip" ? "trips" : portalSection;
  const currentPortalSectionIndex = portalSectionOrder.indexOf(portalSection);

  useEffect(() => {
    window.sessionStorage.setItem(portalSectionStorageKey, String(currentPortalSectionIndex));
  }, [currentPortalSectionIndex]);

  return (
    <div className={classNames.dashboard} id="account-portal" data-transition-direction={transitionDirection}>
      <AccountPortalNav activeSection={activePortalSection} email={settings?.profile.primaryEmail ?? t.access.dashboard.noEmail} />

      <div className={classNames.portalContent}>
        {portalSection === "dashboard" ? (
          <PortalDashboardSection
            accountSession={accountSession}
            classNames={{
              avatar: classNames.avatar,
              profileRow: classNames.profileRow,
              section: classNames.profileCard,
              statGrid: classNames.statGrid,
            }}
            isLoading={isLoading}
            settings={settings}
            stats={stats}
          />
        ) : null}

        {portalSection === "trips" ? (
          <PortalTripsSection
            classNames={{
              section: classNames.historyCard,
              topline: classNames.sectionTopline,
            }}
            isLoading={isLoading}
            trips={trips}
          />
        ) : null}

        {portalSection === "new-trip" ? (
          <PortalNewTripSection
            accountClient={accountClient}
            accountSession={accountSession}
            apiClient={apiClient}
            classNames={{
              card: classNames.newTripCard,
              historyCard: classNames.historyCard,
              topbar: classNames.tripBuilderTopbar,
            }}
            settings={settings}
            onCreatedTrip={onCreatedTrip}
            onError={onError}
            onMessage={onMessage}
          />
        ) : null}

        {portalSection === "explorer" ? (
          <PortalExplorerSection
            classNames={{
              section: classNames.featureCard,
              settingsGrid: classNames.settingsGrid,
              stepSummary: classNames.stepSummary,
            }}
            explorer={explorer}
            isLoading={isLoading}
            trips={trips}
          />
        ) : null}

        {portalSection === "todos" ? (
          <PortalTodosSection className={classNames.featureCard} isLoading={isLoading} todos={todos} />
        ) : null}

        {portalSection === "vault" ? (
          <PortalVaultSection
            accountClient={accountClient}
            accountSession={accountSession}
            classNames={{
              empty: classNames.empty,
              form: classNames.settingsForm,
              section: classNames.featureCard,
              twoCol: classNames.twoCol,
            }}
            isLoading={isLoading}
            vaultItems={vaultItems}
            onError={onError}
            onMessage={onMessage}
            onVaultItemCreated={onVaultItemCreated}
          />
        ) : null}

        {portalSection === "settings" ? (
          <PortalSettingsSection
            accountClient={accountClient}
            accountSession={accountSession}
            classNames={{
              avatar: classNames.avatar,
              deviceList: classNames.deviceList,
              deviceRow: classNames.deviceRow,
              empty: classNames.empty,
              profilePreview: classNames.settingsProfilePreview,
              section: classNames.settingsCard,
              settingsForm: classNames.settingsForm,
              settingsGrid: classNames.settingsGrid,
              twoCol: classNames.twoCol,
            }}
            settings={settings}
            onError={onError}
            onMessage={onMessage}
            onSessionCleared={onSessionCleared}
            onSettingsChanged={onSettingsChanged}
          />
        ) : null}

        {portalSection === "sign-out" ? (
          <PortalSignOutSection className={classNames.profileCard} onLogout={onLogout} />
        ) : null}
      </div>
    </div>
  );
}

function readPreviousPortalSectionIndex(fallbackIndex: number): number {
  if (typeof window === "undefined") return fallbackIndex;
  const storedIndex = Number(window.sessionStorage.getItem(portalSectionStorageKey));
  return Number.isFinite(storedIndex) ? storedIndex : fallbackIndex;
}
