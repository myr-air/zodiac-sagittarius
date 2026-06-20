"use client";

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
import { PortalDashboardSection } from "./portal-dashboard-section";
import { PortalExplorerSection } from "./portal-explorer-section";
import { PortalNewTripSection } from "./portal-new-trip-section";
import { PortalSettingsSection } from "./portal-settings-section";
import { PortalSignOutSection } from "./portal-sign-out-section";
import { PortalTodosSection } from "./portal-todos-section";
import { PortalTripsSection } from "./portal-trips-section";
import { PortalVaultSection } from "./portal-vault-section";
import type { AccountPortalDashboardClassNames } from "./account-portal-dashboard.types";
import {
  accountPortalDashboardSectionClassNames,
  accountPortalExplorerSectionClassNames,
  accountPortalNewTripSectionClassNames,
  accountPortalSettingsSectionClassNames,
  accountPortalTripsSectionClassNames,
  accountPortalVaultSectionClassNames,
} from "./account-portal-section-classnames";

interface AccountPortalSectionContentProps {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  apiClient?: TripApiClient;
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

export function AccountPortalSectionContent({
  accountClient,
  accountSession,
  apiClient,
  classNames,
  explorer,
  isLoading,
  onCreatedTrip,
  onError,
  onLogout,
  onMessage,
  onSessionCleared,
  onSettingsChanged,
  onVaultItemCreated,
  portalSection,
  settings,
  stats,
  todos,
  trips,
  vaultItems,
}: AccountPortalSectionContentProps) {
  return (
    <>
      {portalSection === "dashboard" ? (
        <PortalDashboardSection
          accountSession={accountSession}
          classNames={accountPortalDashboardSectionClassNames(classNames)}
          isLoading={isLoading}
          settings={settings}
          stats={stats}
        />
      ) : null}

      {portalSection === "trips" ? (
        <PortalTripsSection
          classNames={accountPortalTripsSectionClassNames(classNames)}
          isLoading={isLoading}
          trips={trips}
        />
      ) : null}

      {portalSection === "new-trip" ? (
        <PortalNewTripSection
          accountClient={accountClient}
          accountSession={accountSession}
          apiClient={apiClient}
          classNames={accountPortalNewTripSectionClassNames(classNames)}
          settings={settings}
          onCreatedTrip={onCreatedTrip}
          onError={onError}
          onMessage={onMessage}
        />
      ) : null}

      {portalSection === "explorer" ? (
        <PortalExplorerSection
          classNames={accountPortalExplorerSectionClassNames(classNames)}
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
          classNames={accountPortalVaultSectionClassNames(classNames)}
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
          classNames={accountPortalSettingsSectionClassNames(classNames)}
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
    </>
  );
}
