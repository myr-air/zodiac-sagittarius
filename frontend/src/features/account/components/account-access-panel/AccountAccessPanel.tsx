"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  AccountApiClient,
  AccountSession,
  AccountExplorerSummary,
  AccountSettings,
  AccountTodoSummary,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { TripJoinGate } from "@/src/features/account/components/trip-join-gate";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { PortalSection } from "@/src/shared/portal";
import {
  cacheAccountPortalData,
  clearAccountPortalDataCache,
  getAccountPortalDataCache,
  heroDetail,
  heroTitle,
  isAccountEntryMode,
  mainLabel,
  type AccountAccessMode,
} from "./account-access-panel-support";
import { AuthHighlights, AuthTravelCollage } from "./account-entry-hero";
import {
  ACCESS_ERROR_CODES,
  isUnauthenticated,
  localizeAccessError,
  rawErrorMessage,
} from "./account-auth-support";
import { AccountPortalNav } from "./account-portal-nav";
import { AccountPortalLoadingFrame } from "./account-portal-loading-frame";
import type { AuthFlow } from "./account-auth-chrome";
import { EmailLoginPanel } from "./account-email-login-panel";
import {
  accountStepSummaryClassName,
  buildAccountAuthCardClassName,
} from "./account-email-login-styles";
import { accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName } from "./account-panel-shared-styles";
import { StatusMessage } from "./account-status-message";
import { PortalDashboardSection } from "./portal-dashboard-section";
import { PortalExplorerSection } from "./portal-explorer-section";
import { PortalNewTripSection } from "./portal-new-trip-section";
import { PortalSettingsSection } from "./portal-settings-section";
import { PortalSignOutSection } from "./portal-sign-out-section";
import { PortalTodosSection } from "./portal-todos-section";
import { PortalTripsSection } from "./portal-trips-section";
import { PortalVaultSection } from "./portal-vault-section";

interface AccountAccessPanelProps {
  accessMode?: AccountAccessMode;
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSessionLoaded?: boolean;
  accountSuccessRedirectHref?: string;
  portalSection?: PortalSection;
  apiClient?: TripApiClient;
  initialError?: string | null;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  trip?: Trip;
  onAccountSessionChange: (session: AccountSession | null) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

type AccessMode = "account" | "temp";

const accountAvatarClassName = "person-avatar grid size-[30px] place-items-center rounded-full text-xs font-extrabold text-white";
const accountToastStackClassName =
  "account-toast-stack pointer-events-none fixed bottom-6 right-[clamp(18px,4vw,44px)] z-[50] grid w-[min(420px,calc(100vw_-_40px))] gap-2.5 max-[767px]:inset-x-[18px] max-[767px]:bottom-5 max-[767px]:w-auto [&_.account-success]:pointer-events-auto [&_.account-success]:min-h-12 [&_.account-success]:w-full [&_.account-success]:justify-start [&_.account-success]:rounded-(--radius-lg) [&_.account-success]:bg-(--color-success-soft) [&_.account-success]:shadow-[0_10px_22px_rgb(15_23_42_/_0.1)] [&_.join-alert]:pointer-events-auto [&_.join-alert]:min-h-12 [&_.join-alert]:w-full [&_.join-alert]:justify-start [&_.join-alert]:rounded-(--radius-lg) [&_.join-alert]:bg-(--color-danger-soft) [&_.join-alert]:shadow-[0_10px_22px_rgb(15_23_42_/_0.1)] [&>*]:account-toast-item";
const accountPageClassName =
  "account-page min-h-screen bg-[var(--paper-grain),var(--watercolor-page-wash),var(--color-page)] p-7";
const accountEntryPageClassName =
  "account-page--entry grid min-h-[100dvh] items-start overflow-x-clip bg-(--color-page) p-[clamp(18px,4vw,44px)] min-[1100px]:items-center max-[767px]:p-0";
const accountTripAccessPageClassName =
  "account-page--trip-access grid items-center overflow-x-clip bg-(--color-page) p-[clamp(18px,4vw,42px)] max-[767px]:items-start max-[767px]:p-3.5";
const accountPortalPageClassName = "account-page--portal overflow-x-clip pt-[18px] max-[767px]:p-3.5";
const accountPortalNewTripPageClassName =
  "account-page--portal-new-trip !bg-(--color-page) !pt-3.5 max-[767px]:!p-2.5 [&_.account-dashboard]:!block [&_.account-hero]:hidden [&_.portal-content]:!block [&_.portal-content]:!min-h-0 [&_.portal-nav]:hidden";
const accountShellClassName = "account-shell relative mx-auto grid w-[min(100%,1180px)] gap-4 [&>*]:relative";
const accountPortalShellClassName = "gap-3.5";
const accountPortalNewTripShellClassName = "!w-[min(100%,1488px)] !gap-0 max-[767px]:!w-full";
const accountTripAccessShellClassName = "w-[min(100%,1120px)]";
const accountEntryShellClassName =
  "account-shell--entry relative !w-[min(100%,520px)] grid-cols-1 grid-rows-[auto_auto] items-start gap-3.5 min-[1100px]:!w-[min(100%,1240px)] min-[1100px]:grid-cols-[minmax(560px,1.04fr)_minmax(380px,0.96fr)] min-[1100px]:grid-rows-[auto_auto_1fr] min-[1100px]:items-center min-[1100px]:gap-x-7 max-[767px]:!w-full max-[767px]:gap-0";
const tripAccessLanguageSwitchClassName =
  "trip-access-language-switch !right-4 !top-4 !z-[5] !m-0 !w-fit !bg-(--color-surface) !shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:!right-[26px] max-[767px]:!top-[26px]";
const backHomeButtonClassName =
  "back-home-button inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] px-3 py-1.5 text-[0.78rem] font-[850] text-(--color-text-muted) no-underline transition-all duration-150 hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) hover:border-(--color-primary-border) hover:shadow-[0_8px_18px_rgb(194_79_22_/_0.08)] focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-route) focus-visible:border-(--color-route-border)";
const accountEntryBackHomeClassName =
  "account-entry-back-home !absolute !left-11 !top-11 !z-[2] !m-0 !w-fit !bg-(--color-surface) !shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:!left-[18px] max-[767px]:!top-[18px]";
const tripAccessBackHomeClassName =
  "trip-access-back-home !absolute !left-4 !top-4 !z-[5] !m-0 !w-fit !bg-(--color-surface) !shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:!left-[26px] max-[767px]:!top-[26px]";
const accountHeroClassName =
  "account-hero relative grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3.5 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-[18px] shadow-[var(--shadow-soft)] [.account-shell--entry_&]:col-start-1 [.account-shell--entry_&]:row-span-3 [.account-shell--entry_&]:row-start-1 [.account-shell--entry_&]:min-h-[clamp(560px,76vh,680px)] [.account-shell--entry_&]:grid-rows-[auto_auto_1fr] [.account-shell--entry_&]:content-between [.account-shell--entry_&]:overflow-visible [.account-shell--entry_&]:border-transparent [.account-shell--entry_&]:bg-transparent [.account-shell--entry_&]:p-[clamp(44px,6vw,64px)] [.account-shell--entry_&]:shadow-none max-[767px]:[.account-shell--entry_&]:col-start-1 max-[767px]:[.account-shell--entry_&]:row-start-2 max-[767px]:[.account-shell--entry_&]:min-h-0 max-[767px]:[.account-shell--entry_&]:grid-cols-[52px_minmax(0,1fr)] max-[767px]:[.account-shell--entry_&]:gap-3.5 max-[767px]:[.account-shell--entry_&]:overflow-hidden max-[767px]:[.account-shell--entry_&]:p-5 max-[767px]:[.account-shell--entry_&]:pt-5 max-[767px]:[.account-shell--entry_&]:hidden [.account-shell--entry_&>*]:z-[1] [.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:max-w-[330px] max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:max-w-none max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:text-[13px] max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:leading-5 [&_h1]:m-0 [&_h1]:text-3xl [&_h1]:leading-[38px] [&_h1]:text-(--color-text) [.account-shell--entry_&_.join-mark]:absolute [.account-shell--entry_&_.join-mark]:left-11 [.account-shell--entry_&_.join-mark]:top-[108px] max-[767px]:[.account-shell--entry_&_.join-mark]:relative max-[767px]:[.account-shell--entry_&_.join-mark]:inset-auto [.account-shell--entry_&_.join-mark+div]:absolute [.account-shell--entry_&_.join-mark+div]:left-[116px] [.account-shell--entry_&_.join-mark+div]:top-[118px] [.account-shell--entry_&_.join-mark+div]:w-[400px] max-[767px]:[.account-shell--entry_&_.join-mark+div]:relative max-[767px]:[.account-shell--entry_&_.join-mark+div]:inset-auto max-[767px]:[.account-shell--entry_&_.join-mark+div]:w-auto [.account-shell--entry_&_.account-travel-collage]:absolute [.account-shell--entry_&_.account-travel-collage]:col-span-full [.account-shell--entry_&_.account-travel-collage]:row-span-full [.account-shell--entry_&_.account-travel-collage]:right-[clamp(-70px,-5vw,-52px)] [.account-shell--entry_&_.account-travel-collage]:top-[118px] [.account-shell--entry_&_.account-travel-collage]:z-[1] [.account-shell--entry_&_.account-travel-collage]:h-[590px] [.account-shell--entry_&_.account-travel-collage]:w-[330px] [.account-shell--entry_&_.account-travel-collage]:pointer-events-none max-[767px]:[.account-shell--entry_&_.account-travel-collage]:hidden [.account-shell--entry_&_h1]:mt-7 [.account-shell--entry_&_h1]:max-w-[400px] [.account-shell--entry_&_h1]:text-[clamp(40px,3.6vw,52px)] [.account-shell--entry_&_h1]:leading-[1.08] max-[767px]:[.account-shell--entry_&_h1]:mt-2 max-[767px]:[.account-shell--entry_&_h1]:max-w-none max-[767px]:[.account-shell--entry_&_h1]:text-3xl max-[767px]:[.account-shell--entry_&_h1]:leading-[34px] [&_p:not(.join-eyebrow)]:mt-1 [&_p:not(.join-eyebrow)]:mb-0 [&_p:not(.join-eyebrow)]:max-w-[720px] [&_p:not(.join-eyebrow)]:text-sm [&_p:not(.join-eyebrow)]:leading-[22px] [&_p:not(.join-eyebrow)]:text-(--color-text-muted)";
const accountPortalHeroClassName =
  "grid-cols-[40px_minmax(0,1fr)_auto] !items-center px-3.5 py-3 max-[767px]:grid-cols-[36px_minmax(0,1fr)_auto] max-[767px]:p-3 [&_.join-eyebrow]:hidden [&_h1]:!text-[22px] [&_h1]:!leading-7 [&_p:not(.join-eyebrow)]:hidden";
const accountPortalHeroMarkClassName = "!size-10 max-[767px]:!size-9";
const accountPortalLanguageSwitchClassName =
  "col-start-3 row-start-1 !m-0 self-center justify-self-end max-[767px]:[&_.language-switch-option]:min-w-[34px]";
const accountHeroMarkClassName = "join-mark account-hero-mark grid size-[52px] place-items-center rounded-(--radius-md) bg-(--color-primary) text-white [&_.icon]:size-6";
const accountHeroEyebrowClassName = "join-eyebrow mb-0.5 mt-0 text-xs font-extrabold uppercase tracking-normal text-(--color-primary-strong)";
const accountEntryBrandTaglineClassName =
  "account-entry-brand-tagline m-0 text-[13px] font-bold leading-[18px] text-(--color-primary-strong)";
const accountCardClassName =
  "account-card grid gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[var(--shadow-soft)]";
const portalLoadingCardClassName = cn(accountCardClassName, "portal-loading-card col-span-2 min-h-[220px] max-[767px]:col-auto");
const accountModeTabsClassName =
  "account-mode-tabs inline-grid w-[min(100%,420px)] grid-cols-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-1";
const accountTabClassName =
  "account-tab inline-flex min-h-[42px] items-center justify-center gap-2 rounded-(--radius-md) border-0 bg-transparent font-extrabold text-(--color-text-muted) transition-[background,color] duration-[180ms] ease-out";
const accountTabActiveClassName = "account-tab--active bg-(--color-primary-soft) text-(--color-primary-strong)";
const accountDashboardClassName = "account-dashboard grid grid-cols-[220px_minmax(0,1fr)] items-start gap-3.5 max-[767px]:grid-cols-1";
const portalContentClassName = "portal-content grid min-h-[460px] grid-cols-2 items-start gap-2.5 max-[767px]:min-h-[520px] max-[767px]:grid-cols-1";
const portalProfileCardClassName = cn(accountCardClassName, "account-profile-card col-span-2 max-[767px]:col-auto");
const portalHistoryCardClassName = cn(accountCardClassName, "account-history col-span-2 max-[767px]:col-auto");
const portalNewTripCardClassName =
  "portal-new-trip-card !gap-[18px] !min-h-[calc(100vh-28px)] !overflow-visible !rounded-[16px] !border !border-[rgb(226_232_240_/_0.72)] !bg-[#ffffff] !p-[18px] !shadow-[0_12px_28px_rgb(15_23_42_/_0.07)] max-[767px]:!min-h-[calc(100vh-20px)] max-[767px]:!rounded-none max-[767px]:!border-0 max-[767px]:!p-0 max-[767px]:!shadow-none";
const tripBuilderTopbarClassName =
  "trip-builder-topbar grid grid-cols-[132px_minmax(0,1fr)_auto] items-center gap-7 pb-[18px] max-[767px]:grid-cols-[1fr_auto] max-[767px]:gap-2.5 [&>.badge]:mt-2 [&>.badge]:justify-self-end [&>.button]:min-h-[58px] [&>.button]:rounded-[9px] [&>.button]:bg-[rgb(255_255_255_/_0.88)] [&>.button]:shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] max-[767px]:[&>.button]:w-auto max-[767px]:[&>.button]:min-w-[118px] [&>.trip-builder-title]:grid [&>.trip-builder-title]:min-w-0 [&>.trip-builder-title]:justify-self-start [&>.trip-builder-title]:gap-0.5 [&>.trip-builder-title]:text-left max-[767px]:[&>.trip-builder-title]:col-span-full [&>.trip-builder-title>span]:hidden [&>.trip-builder-title>strong]:inline-flex [&>.trip-builder-title>strong]:items-center [&>.trip-builder-title>strong]:gap-2.5 [&>.trip-builder-title>strong]:text-[30px] [&>.trip-builder-title>strong]:leading-[34px] [&>.trip-builder-title>strong]:text-(--color-text) max-[767px]:[&>.trip-builder-title>strong]:text-[28px] max-[767px]:[&>.trip-builder-title>strong]:leading-8 [&>.trip-builder-title>small]:mt-2 [&>.trip-builder-title>small]:block [&>.trip-builder-title>small]:max-w-[420px] [&>.trip-builder-title>small]:text-[13px] [&>.trip-builder-title>small]:font-[650] [&>.trip-builder-title>small]:leading-[18px] [&>.trip-builder-title>small]:text-(--color-text-muted) max-[767px]:[&>.trip-builder-title>small]:max-w-[260px] max-[767px]:[&>.trip-builder-title>small]:text-[11px]";
const portalFeatureCardClassName = cn(accountCardClassName, "portal-feature-card col-span-2 max-[767px]:col-auto");
const portalSettingsCardClassName = cn(accountCardClassName, "account-settings-card col-span-2 max-[767px]:col-auto");
const accountStatGridClassName = "account-stat-grid grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1";
const accountSettingsGridClassName = "account-settings-grid grid grid-cols-2 gap-2.5";
const portalSectionToplineClassName =
  "portal-section-topline flex min-w-0 items-start justify-between gap-3 max-[767px]:flex-wrap [&_.account-panel-heading]:flex-auto [&>.button]:max-[767px]:w-full [&>button]:max-[767px]:w-full";
const accountProfileRowClassName =
  "account-profile-row flex min-w-0 items-center gap-3 max-[767px]:flex-wrap max-[767px]:items-start [&>.badge]:ml-auto max-[767px]:[&>.badge]:ml-0 [&>div]:max-[767px]:min-w-0 [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block [&_strong]:text-(--color-text)";
const accountEmptyClassName = "account-empty text-[13px] leading-5 text-(--color-text-muted)";
const settingsProfilePreviewClassName = "settings-profile-preview grid grid-cols-[46px_minmax(0,1fr)] items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
const accountDeviceListClassName = "account-device-list grid gap-2";
const accountDeviceRowClassName =
  "account-device-row flex min-w-0 items-center justify-between gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 max-[767px]:flex-wrap max-[767px]:items-start [&>.button]:w-auto [&>.button]:min-w-[124px] [&>.button]:shrink-0 max-[767px]:[&>.button]:w-full [&>div]:max-[767px]:min-w-0 [&_span]:block [&_span]:text-xs [&_span]:leading-[18px] [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block";
const accountFormClassName =
  "account-form [&_input]:min-h-[46px] [&_input]:w-full [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-(--color-text) [&_input]:transition-[border-color,box-shadow,background] [&_input]:duration-[180ms] [&_input]:ease-out [&_input:focus]:border-(--color-route-border) [&_input:focus]:shadow-[0_0_0_4px_rgb(191_219_254_/_0.45)] [&_input:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted) [&_select]:min-h-[46px] [&_select]:w-full [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border-strong) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-(--color-text) [&_select]:transition-[border-color,box-shadow,background] [&_select]:duration-[180ms] [&_select]:ease-out [&_select:focus]:border-(--color-route-border) [&_select:focus]:shadow-[0_0_0_4px_rgb(191_219_254_/_0.45)] [&_select:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))]";
const accountTwoColClassName =
  "account-two-col grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted)";
const accountSettingsFormClassName = cn(accountFormClassName, "account-settings-form grid gap-3");
const accountAuthCardClassName = buildAccountAuthCardClassName(accountCardClassName, accountFormClassName);

const portalSectionOrder: PortalSection[] = ["dashboard", "trips", "new-trip", "explorer", "todos", "vault", "settings", "sign-out"];
const portalSectionStorageKey = "sagittarius:portal-section-index";

export function AccountAccessPanel({
  accessMode = "combined",
  accountClient,
  accountSession,
  accountSessionLoaded = true,
  accountSuccessRedirectHref,
  apiClient,
  initialError,
  initialJoinCode,
  initialJoinToken,
  onAccountSessionChange,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  portalSection = "dashboard",
  trip,
}: AccountAccessPanelProps) {
  const { t } = useI18n();
  const accessMessages = t.access.messages;
  const [clientPortalRedirected, setClientPortalRedirected] = useState(false);
  const effectiveAccessMode = clientPortalRedirected ? "account-portal" : accessMode;
  const [entryFlowOverride, setEntryFlowOverride] = useState<AuthFlow | null>(null);
  const entryFlow = entryFlowOverride ?? (accessMode === "account-register" ? "register" : "login");
  const effectiveEntryAccessMode = isAccountEntryMode(effectiveAccessMode)
    ? entryFlow === "register" ? "account-register" : "account-login"
    : effectiveAccessMode;
  const forcedMode = effectiveAccessMode === "trip-access" ? "temp" : effectiveAccessMode === "combined" ? null : "account";
  const isAccountEntry = effectiveAccessMode === "account-login" || effectiveAccessMode === "account-register";
  const isPortalEntry = effectiveAccessMode === "account-portal";
  const isTripAccessEntry = effectiveAccessMode === "trip-access";
  const [selectedMode, setSelectedMode] = useState<AccessMode>(() => (accountSession ? "account" : "temp"));
  const mode = forcedMode ?? (accountSession ? "account" : selectedMode);
  const initialPortalData = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const [settings, setSettings] = useState<AccountSettings | null>(() => initialPortalData?.settings ?? null);
  const [trips, setTrips] = useState<AccountTripSummary[]>(() => initialPortalData?.trips ?? []);
  const [stats, setStats] = useState<AccountTripStats | null>(() => initialPortalData?.stats ?? null);
  const [explorer, setExplorer] = useState<AccountExplorerSummary | null>(() => initialPortalData?.explorer ?? null);
  const [todos, setTodos] = useState<AccountTodoSummary[]>(() => initialPortalData?.todos ?? []);
  const [vaultItems, setVaultItems] = useState<AccountVaultItemSummary[]>(() => initialPortalData?.vaultItems ?? []);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountSession, setPendingAccountSession] = useState<AccountSession | null>(null);
  const displayError = error ? localizeAccessError(error, accessMessages) ?? error : localizeAccessError(initialError ?? null, accessMessages);
  const currentPortalCache = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const displayedSettings = settings ?? currentPortalCache?.settings ?? null;
  const displayedTrips = trips.length ? trips : currentPortalCache?.trips ?? [];
  const displayedStats = stats ?? currentPortalCache?.stats ?? null;
  const displayedExplorer = explorer ?? currentPortalCache?.explorer ?? null;
  const displayedTodos = todos.length ? todos : currentPortalCache?.todos ?? [];
  const displayedVaultItems = vaultItems.length ? vaultItems : currentPortalCache?.vaultItems ?? [];

  useEffect(() => {
    if (!accountSession || isAccountEntry) {
      return;
    }

    let cancelled = false;
    const cachedData = getAccountPortalDataCache(accountSession.sessionToken);

    Promise.allSettled([
      accountClient.loadSettings(accountSession.sessionToken),
      accountClient.listTrips(accountSession.sessionToken),
      accountClient.loadStats(accountSession.sessionToken),
      accountClient.loadExplorer(accountSession.sessionToken),
      accountClient.listToDos(accountSession.sessionToken),
      accountClient.listVault(accountSession.sessionToken),
    ])
      .then(([nextSettings, nextTrips, nextStats, nextExplorer, nextTodos, nextVaultItems]) => {
        if (cancelled) return;
        const failures = [nextSettings, nextTrips, nextStats, nextExplorer, nextTodos, nextVaultItems]
          .filter((result) => result.status === "rejected");
        if (nextSettings.status === "fulfilled") setSettings(nextSettings.value);
        if (nextTrips.status === "fulfilled") setTrips(nextTrips.value);
        if (nextStats.status === "fulfilled") setStats(nextStats.value);
        if (nextExplorer.status === "fulfilled") setExplorer(nextExplorer.value);
        if (nextTodos.status === "fulfilled") setTodos(nextTodos.value);
        if (nextVaultItems.status === "fulfilled") setVaultItems(nextVaultItems.value);
        cacheAccountPortalData(accountSession.sessionToken, {
          settings: nextSettings.status === "fulfilled" ? nextSettings.value : cachedData?.settings ?? null,
          trips: nextTrips.status === "fulfilled" ? nextTrips.value : cachedData?.trips ?? [],
          stats: nextStats.status === "fulfilled" ? nextStats.value : cachedData?.stats ?? null,
          explorer: nextExplorer.status === "fulfilled" ? nextExplorer.value : cachedData?.explorer ?? null,
          todos: nextTodos.status === "fulfilled" ? nextTodos.value : cachedData?.todos ?? [],
          vaultItems: nextVaultItems.status === "fulfilled" ? nextVaultItems.value : cachedData?.vaultItems ?? [],
        });
        if (failures.some((result) => isUnauthenticated(result.reason))) {
          clearAccountPortalDataCache(accountSession.sessionToken);
          onAccountSessionChange(null);
          return;
        }
        if (failures.length) {
          setError(rawErrorMessage(failures[0].reason, ACCESS_ERROR_CODES.accountLoadFailed));
        } else {
          setError(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountClient, accountSession, isAccountEntry, onAccountSessionChange]);

  useEffect(() => {
    if (!pendingAccountSession) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onAccountSessionChange(pendingAccountSession);
      if (accountSuccessRedirectHref) {
        if (pendingAccountSession.kind === "trusted") {
          window.location.replace(accountSuccessRedirectHref);
        } else {
          window.history.replaceState(null, "", accountSuccessRedirectHref);
          setClientPortalRedirected(true);
        }
      }
      setPendingAccountSession(null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [accountSuccessRedirectHref, onAccountSessionChange, pendingAccountSession]);

  async function refreshAccount(sessionToken: string) {
    const [nextSettings, nextTrips, nextStats] = await Promise.all([
      accountClient.loadSettings(sessionToken),
      accountClient.listTrips(sessionToken),
      accountClient.loadStats(sessionToken),
    ]);
    setSettings(nextSettings);
    setTrips(nextTrips);
    setStats(nextStats);
    cacheAccountPortalData(sessionToken, {
      settings: nextSettings,
      trips: nextTrips,
      stats: nextStats,
      explorer,
      todos,
      vaultItems,
    });
  }

  return (
    <main
      className={cn(
        accountPageClassName,
        isAccountEntry ? accountEntryPageClassName : "",
        isPortalEntry ? accountPortalPageClassName : "",
        isTripAccessEntry ? accountTripAccessPageClassName : "",
        isPortalEntry && portalSection === "new-trip" ? accountPortalNewTripPageClassName : "",
      )}
      aria-label={mainLabel(effectiveEntryAccessMode, t.access.mainLabels)}
    >
      <section className={cn(accountShellClassName, isAccountEntry ? accountEntryShellClassName : "", isPortalEntry ? accountPortalShellClassName : "", isPortalEntry && portalSection === "new-trip" ? accountPortalNewTripShellClassName : "", isTripAccessEntry ? accountTripAccessShellClassName : "")}>
        {isAccountEntry ? (
          <>
            <Link href={appRoutes.home()} className={cn(backHomeButtonClassName, accountEntryBackHomeClassName)}>
              <Icon name="chevronLeft" className="size-3.5" />
              {t.access.backToHome}
            </Link>
          </>
        ) : null}
        {isTripAccessEntry ? (
          <>
            <Link href={appRoutes.home()} className={cn(backHomeButtonClassName, tripAccessBackHomeClassName)}>
              <Icon name="chevronLeft" className="size-3.5" />
              {t.access.backToHome}
            </Link>
            <LanguageSwitch className={cn(accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName, tripAccessLanguageSwitchClassName)} />
          </>
        ) : null}
        {!isTripAccessEntry ? <div className={cn(accountHeroClassName, isPortalEntry ? accountPortalHeroClassName : "")}>
          <div className={cn(accountHeroMarkClassName, isPortalEntry ? accountPortalHeroMarkClassName : "")} aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className={accountHeroEyebrowClassName}>{isAccountEntry ? t.access.entryHero.brand : t.access.eyebrow}</p>
            {isAccountEntry ? <p className={accountEntryBrandTaglineClassName}>{t.access.entryHero.tagline}</p> : null}
            <h1>{isAccountEntry ? t.access.entryHero.title : heroTitle(effectiveEntryAccessMode, t.access.titles)}</h1>
            <div className="h-6"></div>
            <p>{isAccountEntry ? t.access.entryHero.detail : heroDetail(effectiveEntryAccessMode, t.access.details)}</p>
            {isAccountEntry || (isPortalEntry && portalSection === "new-trip") ? null : <LanguageSwitch className={cn(accessLanguageSwitchClassName, isPortalEntry ? accountPortalLanguageSwitchClassName : "")} />}
          </div>
          {isAccountEntry ? <AuthTravelCollage labels={t.access.entryHero} /> : null}
          {isAccountEntry ? <AuthHighlights flow={entryFlow} highlights={t.access.highlights} entryHero={t.access.entryHero} /> : null}
        </div> : null}

        {effectiveAccessMode === "combined" ? (
          <div className={accountModeTabsClassName} role="tablist" aria-label={t.access.tabs.label}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "account"}
              className={cn(accountTabClassName, mode === "account" ? accountTabActiveClassName : "")}
              onClick={() => setSelectedMode("account")}
            >
              <Icon name="users" />
              {t.access.tabs.account}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "temp"}
              className={cn(accountTabClassName, mode === "temp" ? accountTabActiveClassName : "")}
              onClick={() => setSelectedMode("temp")}
            >
              <Icon name="clock" />
              {t.access.tabs.temp}
            </button>
          </div>
        ) : null}

        {isAccountEntry && message ? (
          <div className={accountToastStackClassName} aria-live="polite">
            {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
          </div>
        ) : null}

        {!isAccountEntry && message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
        {!isAccountEntry && displayError ? <StatusMessage tone="danger">{displayError}</StatusMessage> : null}

        {mode === "temp" ? (
          <TripJoinGate
            apiClient={apiClient}
            embedded
            initialJoinCode={initialJoinCode}
            initialJoinToken={initialJoinToken}
            trip={trip}
            variant={isTripAccessEntry ? "trip-access" : "default"}
            onAuthenticated={onAuthenticated}
            onCockpitLoaded={onCockpitLoaded}
            onTripChange={onTripChange}
          />
        ) : pendingAccountSession ? (
          <StatusMessage tone="success">{t.access.portalDelay.detail}</StatusMessage>
        ) : isAccountEntry ? (
          <EmailLoginPanel
            flow={entryFlow}
            accountClient={accountClient}
            authCardClassName={accountAuthCardClassName}
            formError={displayError}
            showRouteTabs
            onFlowChange={setEntryFlowOverride}
            onLoggedIn={(session) => {
              setMessage(session.kind === "trusted" ? t.access.messages.trustedLogin : t.access.messages.temporaryLogin);
              setPendingAccountSession(session);
            }}
            onError={setError}
          />
        ) : !accountSessionLoaded && effectiveAccessMode === "account-portal" ? (
          <AccountPortalLoadingFrame
            classNames={{
              content: portalContentClassName,
              dashboard: accountDashboardClassName,
              loadingCard: portalLoadingCardClassName,
            }}
            portalSection={portalSection}
          />
        ) : accountSession ? (
          <AccountDashboard
            accountClient={accountClient}
            apiClient={apiClient}
            accountSession={accountSession}
            isLoading={!displayedSettings}
            settings={displayedSettings}
            stats={displayedStats}
            explorer={displayedExplorer}
            trips={displayedTrips}
            todos={displayedTodos}
            vaultItems={displayedVaultItems}
            key={portalSection}
            portalSection={portalSection}
            onSettingsChanged={setSettings}
            onVaultItemCreated={(item) => setVaultItems((current) => [item, ...current])}
            onCreatedTrip={async (session, options) => {
              if (options?.openTrip !== false) {
                onAuthenticated(session);
                if (apiClient) {
                  const cockpit = await apiClient.loadTrip(session.tripId, session.sessionToken);
                  onTripChange(cockpit.trip);
                  onCockpitLoaded?.(cockpit);
                }
              }
              await refreshAccount(accountSession.sessionToken);
            }}
            onLogout={async () => {
              await accountClient.logout(accountSession.sessionToken);
              clearAccountPortalDataCache(accountSession.sessionToken);
              onAccountSessionChange(null);
              setMessage(t.access.messages.loggedOut);
            }}
            onSessionCleared={() => {
              clearAccountPortalDataCache(accountSession.sessionToken);
              onAccountSessionChange(null);
            }}
            onMessage={setMessage}
            onError={setError}
          />
        ) : (
          <EmailLoginPanel
            flow={entryFlow}
            accountClient={accountClient}
            authCardClassName={accountAuthCardClassName}
            formError={isAccountEntry ? displayError : null}
            showRouteTabs={isAccountEntry}
            onFlowChange={setEntryFlowOverride}
            onLoggedIn={(session) => {
              setMessage(session.kind === "trusted" ? t.access.messages.trustedLogin : t.access.messages.temporaryLogin);
              setPendingAccountSession(session);
            }}
            onError={setError}
          />
        )}
      </section>
    </main>
  );
}


function AccountDashboard({
  accountClient,
  apiClient,
  accountSession,
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
}: {
  accountClient: AccountApiClient;
  apiClient?: TripApiClient;
  accountSession: AccountSession;
  explorer: AccountExplorerSummary | null;
  isLoading: boolean;
  onCreatedTrip: (session: TripParticipantSession, options?: { openTrip?: boolean }) => Promise<void>;
  onError: (message: string | null) => void;
  onLogout: () => Promise<void>;
  onSessionCleared: () => void;
  onMessage: (message: string | null) => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  onVaultItemCreated: (item: AccountVaultItemSummary) => void;
  portalSection: PortalSection;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}) {
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
    <div className={accountDashboardClassName} id="account-portal" data-transition-direction={transitionDirection}>
      <AccountPortalNav activeSection={activePortalSection} email={settings?.profile.primaryEmail ?? t.access.dashboard.noEmail} />

      <div className={portalContentClassName}>
        {portalSection === "dashboard" ? (
          <PortalDashboardSection
            accountSession={accountSession}
            classNames={{
              avatar: accountAvatarClassName,
              profileRow: accountProfileRowClassName,
              section: portalProfileCardClassName,
              statGrid: accountStatGridClassName,
            }}
            isLoading={isLoading}
            settings={settings}
            stats={stats}
          />
        ) : null}

        {portalSection === "trips" ? (
          <PortalTripsSection
            classNames={{
              section: portalHistoryCardClassName,
              topline: portalSectionToplineClassName,
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
              card: portalNewTripCardClassName,
              historyCard: portalHistoryCardClassName,
              topbar: tripBuilderTopbarClassName,
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
              section: portalFeatureCardClassName,
              settingsGrid: accountSettingsGridClassName,
              stepSummary: accountStepSummaryClassName,
            }}
            explorer={explorer}
            isLoading={isLoading}
            trips={trips}
          />
        ) : null}

        {portalSection === "todos" ? (
          <PortalTodosSection className={portalFeatureCardClassName} isLoading={isLoading} todos={todos} />
        ) : null}

        {portalSection === "vault" ? (
          <PortalVaultSection
            accountClient={accountClient}
            accountSession={accountSession}
            classNames={{
              empty: accountEmptyClassName,
              form: accountSettingsFormClassName,
              section: portalFeatureCardClassName,
              twoCol: accountTwoColClassName,
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
              avatar: accountAvatarClassName,
              deviceList: accountDeviceListClassName,
              deviceRow: accountDeviceRowClassName,
              empty: accountEmptyClassName,
              profilePreview: settingsProfilePreviewClassName,
              section: portalSettingsCardClassName,
              settingsForm: accountSettingsFormClassName,
              settingsGrid: accountSettingsGridClassName,
              twoCol: accountTwoColClassName,
            }}
            settings={settings}
            onError={onError}
            onMessage={onMessage}
            onSessionCleared={onSessionCleared}
            onSettingsChanged={onSettingsChanged}
          />
        ) : null}

        {portalSection === "sign-out" ? (
          <PortalSignOutSection className={portalProfileCardClassName} onLogout={onLogout} />
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
