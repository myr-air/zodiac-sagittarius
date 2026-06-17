"use client";

import { CSSProperties, FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import type {
  AccountApiClient,
  AccountSession,
  AccountExplorerSummary,
  AccountSettings,
  AccountTodoSummary,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { Badge, Button, Select } from "@/src/ui";
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
  getLatestAccountPortalDataCache,
  heroDetail,
  heroTitle,
  isAccountEntryMode,
  mainLabel,
  type AccountAccessMode,
} from "./account-access-panel-support";
import { AuthHighlights, AuthTravelCollage } from "./account-entry-hero";
import {
  PanelHeading,
  PortalEmptyState,
  PortalListSkeleton,
  PortalStatSkeleton,
  SettingLine,
  Stat,
  portalSkeletonBlockClassName,
  portalSkeletonLineClassName,
  portalSkeletonTitleClassName,
} from "./account-portal-primitives";
import {
  ACCESS_ERROR_CODES,
  arrayBufferToBase64Url,
  createPasskeyCredential,
  errorMessage,
  formatDateTime,
  getPasskeyCredential,
  isUnauthenticated,
  localizeAccessError,
  passwordLoginErrorMessage,
  rawErrorMessage,
} from "./account-auth-support";
import {
  buildInviteEmailHref,
  buildInviteLink,
  defaultTripForm,
  normalizedTripForm,
} from "./account-trip-wizard-support";
import { AccountPortalNav } from "./account-portal-nav";
import { AccountSettingsEditor } from "./account-settings-editor";
import { PortalTripWizard } from "./portal-trip-wizard";

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
type AuthFlow = "login" | "register";
type AuthTransitionDirection = "forward" | "back" | "mode";

const accountEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const accountAvatarClassName = "person-avatar grid size-[30px] place-items-center rounded-full text-xs font-extrabold text-white";
const accountDangerStatusClassName = "join-alert m-0 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2.5 text-[13px] font-bold text-(--color-danger)";
const accountSuccessStatusClassName =
  "account-success m-0 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-success-border) bg-(--color-success-soft) px-3 py-2.5 text-[13px] font-extrabold text-(--color-success)";
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
const accessLanguageSwitchClassName = "access-language-switch mt-3.5";
const accountEntryLanguageSwitchClassName =
  "account-entry-language-switch !absolute !right-4 !top-4 !z-[2] !m-0 !w-fit !bg-(--color-surface) !shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:!right-[18px] max-[767px]:!top-[18px]";
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
const accountEntryTabsClassName = "account-entry-tabs grid grid-cols-2 gap-0 border-b border-(--color-border) px-[34px] pb-3.5 max-[520px]:px-0";
const accountDashboardClassName = "account-dashboard grid grid-cols-[220px_minmax(0,1fr)] items-start gap-3.5 max-[767px]:grid-cols-1";
const portalContentClassName = "portal-content grid min-h-[460px] grid-cols-2 items-start gap-2.5 max-[767px]:min-h-[520px] max-[767px]:grid-cols-1";
const portalProfileCardClassName = cn(accountCardClassName, "account-profile-card col-span-2 max-[767px]:col-auto");
const portalHistoryCardClassName = cn(accountCardClassName, "account-history col-span-2 max-[767px]:col-auto");
const portalNewTripCardClassName =
  "portal-new-trip-card !gap-[18px] !min-h-[calc(100vh-28px)] !overflow-visible !rounded-[16px] !border !border-[rgb(226_232_240_/_0.72)] !bg-[#ffffff] !p-[18px] !shadow-[0_12px_28px_rgb(15_23_42_/_0.07)] max-[767px]:!min-h-[calc(100vh-20px)] max-[767px]:!rounded-none max-[767px]:!border-0 max-[767px]:!p-0 max-[767px]:!shadow-none";
const tripBuilderTopbarClassName =
  "trip-builder-topbar grid grid-cols-[132px_minmax(0,1fr)_auto] items-center gap-7 pb-[18px] max-[767px]:grid-cols-[1fr_auto] max-[767px]:gap-2.5 [&>.badge]:mt-2 [&>.badge]:justify-self-end [&>.button]:min-h-[58px] [&>.button]:rounded-[9px] [&>.button]:bg-[rgb(255_255_255_/_0.88)] [&>.button]:shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] max-[767px]:[&>.button]:w-auto max-[767px]:[&>.button]:min-w-[118px] [&>.trip-builder-title]:grid [&>.trip-builder-title]:min-w-0 [&>.trip-builder-title]:justify-self-start [&>.trip-builder-title]:gap-0.5 [&>.trip-builder-title]:text-left max-[767px]:[&>.trip-builder-title]:col-span-full [&>.trip-builder-title>span]:hidden [&>.trip-builder-title>strong]:inline-flex [&>.trip-builder-title>strong]:items-center [&>.trip-builder-title>strong]:gap-2.5 [&>.trip-builder-title>strong]:text-[30px] [&>.trip-builder-title>strong]:leading-[34px] [&>.trip-builder-title>strong]:text-(--color-text) max-[767px]:[&>.trip-builder-title>strong]:text-[28px] max-[767px]:[&>.trip-builder-title>strong]:leading-8 [&>.trip-builder-title>small]:mt-2 [&>.trip-builder-title>small]:block [&>.trip-builder-title>small]:max-w-[420px] [&>.trip-builder-title>small]:text-[13px] [&>.trip-builder-title>small]:font-[650] [&>.trip-builder-title>small]:leading-[18px] [&>.trip-builder-title>small]:text-(--color-text-muted) max-[767px]:[&>.trip-builder-title>small]:max-w-[260px] max-[767px]:[&>.trip-builder-title>small]:text-[11px]";
const tripCreatedShareClassName =
  "trip-created-share grid gap-2.5 rounded-[12px] border border-(--color-success-border) bg-[linear-gradient(180deg,rgb(240_253_244_/_0.94),white)] p-3 text-[13px] font-bold text-(--color-text-muted) [&_strong]:text-(--color-text) [&_code]:rounded-[6px] [&_code]:bg-white [&_code]:px-2 [&_code]:py-1 [&_code]:text-xs [&_code]:font-black [&_code]:text-(--color-primary-strong) [&_div]:flex [&_div]:flex-wrap [&_div]:gap-2 [&_.button]:w-auto";
const tripCreatedShareLinkClassName =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 py-[7px] text-[13px] font-extrabold text-(--color-primary-strong) no-underline";
const portalFeatureCardClassName = cn(accountCardClassName, "portal-feature-card col-span-2 max-[767px]:col-auto");
const portalSettingsCardClassName = cn(accountCardClassName, "account-settings-card col-span-2 max-[767px]:col-auto");
const accountStatGridClassName = "account-stat-grid grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1";
const accountSettingsGridClassName = "account-settings-grid grid grid-cols-2 gap-2.5";
const portalSectionToplineClassName =
  "portal-section-topline flex min-w-0 items-start justify-between gap-3 max-[767px]:flex-wrap [&_.account-panel-heading]:flex-auto [&>.button]:max-[767px]:w-full [&>button]:max-[767px]:w-full";
const accountProfileRowClassName =
  "account-profile-row flex min-w-0 items-center gap-3 max-[767px]:flex-wrap max-[767px]:items-start [&>.badge]:ml-auto max-[767px]:[&>.badge]:ml-0 [&>div]:max-[767px]:min-w-0 [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block [&_strong]:text-(--color-text)";
const accountTripListClassName = "account-trip-list grid gap-2";
const accountTripRowClassName =
  "account-trip-row flex min-h-[62px] min-w-0 items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 text-inherit no-underline transition-[border-color,background] duration-[180ms] ease-out hover:border-[color-mix(in_srgb,var(--color-primary)_32%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary-soft)_52%,var(--color-surface))] focus-visible:border-[color-mix(in_srgb,var(--color-primary)_32%,var(--color-border))] focus-visible:bg-[color-mix(in_srgb,var(--color-primary-soft)_52%,var(--color-surface))] focus-visible:outline-none max-[767px]:flex-wrap max-[767px]:items-start [&>.badge]:ml-auto max-[767px]:[&>.badge]:ml-0 [&>div]:max-[767px]:min-w-0 [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block [&_strong]:text-(--color-text)";
const accountTripIconClassName =
  "account-trip-icon grid size-9 shrink-0 place-items-center rounded-(--radius-md) bg-(--color-primary-soft) text-(--color-primary-strong)";
const accountEmptyClassName = "account-empty text-[13px] leading-5 text-(--color-text-muted)";
const cloudProviderPanelClassName = "cloud-provider-panel grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
const cloudProviderGridClassName = "cloud-provider-grid grid grid-cols-4 gap-2 max-[767px]:grid-cols-2";
const cloudProviderButtonClassName = "cloud-provider-button inline-flex min-h-[46px] items-center justify-center gap-2 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) text-xs font-[850] text-(--color-text) transition-[border-color,background,color] duration-[180ms] hover:border-(--color-primary) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) focus-visible:border-(--color-primary) focus-visible:bg-(--color-primary-soft) focus-visible:text-(--color-primary-strong) disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:hover:border-(--color-border) disabled:hover:bg-(--color-surface-muted) disabled:hover:text-(--color-text-muted)";
const settingsProfilePreviewClassName = "settings-profile-preview grid grid-cols-[46px_minmax(0,1fr)] items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
const portalSearchClassName =
  "portal-search grid min-h-[46px] grid-cols-[20px_minmax(0,1fr)] items-center gap-2.5 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3 text-(--color-text-muted) [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:font-[inherit] [&_input]:font-[750] [&_input]:text-(--color-text) [&_input]:outline-0";
const portalMapPreviewClassName =
  "portal-map-preview relative min-h-[220px] overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-[linear-gradient(90deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),linear-gradient(0deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),radial-gradient(circle_at_24%_30%,rgb(194_79_22_/_0.16),transparent_24%),radial-gradient(circle_at_76%_68%,rgb(37_99_235_/_0.14),transparent_26%),var(--color-surface-subtle)] bg-[length:34px_34px,34px_34px,auto,auto,auto] max-[767px]:min-h-[180px]";
const portalMapPinClassName =
  "portal-map-pin absolute left-[var(--pin-x)] top-[var(--pin-y)] z-[1] grid size-[34px] place-items-center rounded-full border border-(--color-primary-border) bg-(--color-surface) text-(--color-primary-strong) shadow-[var(--shadow-soft)]";
const accountDeviceListClassName = "account-device-list grid gap-2";
const accountDeviceRowClassName =
  "account-device-row flex min-w-0 items-center justify-between gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 max-[767px]:flex-wrap max-[767px]:items-start [&>.button]:w-auto [&>.button]:min-w-[124px] [&>.button]:shrink-0 max-[767px]:[&>.button]:w-full [&>div]:max-[767px]:min-w-0 [&_span]:block [&_span]:text-xs [&_span]:leading-[18px] [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block";
const accountFormClassName =
  "account-form [&_input]:min-h-[46px] [&_input]:w-full [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-(--color-text) [&_input]:transition-[border-color,box-shadow,background] [&_input]:duration-[180ms] [&_input]:ease-out [&_input:focus]:border-(--color-route-border) [&_input:focus]:shadow-[0_0_0_4px_rgb(191_219_254_/_0.45)] [&_input:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted) [&_select]:min-h-[46px] [&_select]:w-full [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border-strong) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-(--color-text) [&_select]:transition-[border-color,box-shadow,background] [&_select]:duration-[180ms] [&_select]:ease-out [&_select:focus]:border-(--color-route-border) [&_select:focus]:shadow-[0_0_0_4px_rgb(191_219_254_/_0.45)] [&_select:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))]";
const accountCheckClassName =
  "account-check grid grid-cols-[auto_minmax(0,1fr)] items-center [&_input]:min-h-[18px] [&_input]:w-[18px]";
const accountFieldClassName = "account-field grid gap-1.5";
const accountFieldHintClassName = "account-field-hint m-0 text-xs font-[650] leading-[18px] text-(--color-text-muted)";
const accountTwoColClassName =
  "account-two-col grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted)";
const accountSettingsFormClassName = cn(accountFormClassName, "account-settings-form grid gap-3");
const accountLoginFlowClassName = "account-login-flow grid w-[min(100%,560px)] justify-self-center gap-3";
const accountEntryLoginFlowClassName =
  "relative row-start-2 w-full self-start justify-self-center gap-[22px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-[clamp(22px,3vw,34px)] pt-[70px] shadow-[0_14px_34px_rgb(15_23_42_/_0.1)] min-[1100px]:col-start-2 min-[1100px]:row-start-3 min-[1100px]:w-[min(100%,520px)] max-[767px]:row-start-1 max-[767px]:min-h-[100dvh] max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:p-[18px] max-[767px]:pt-[92px] max-[767px]:shadow-none";
const accountAuthCardClassName = cn(
  accountCardClassName,
  "account-auth-card !gap-4 !overflow-visible !border-0 !bg-transparent !p-0 !shadow-none [&_.button]:min-h-11 [&_.button]:w-full",
  accountFormClassName,
);
const accountStepKickerClassName = "account-step-kicker block text-xs font-[850] leading-[18px] text-(--color-text-muted)";
const accountStepStageClassName =
  "account-step-stage grid gap-4 overflow-visible [animation-duration:260ms] [animation-fill-mode:both] [animation-timing-function:cubic-bezier(0.2,0.72,0.28,1)] motion-reduce:animate-none";
const accountStepStageDirectionClassNames = {
  back: "account-step-stage--back animate-[account-step-in-back]",
  forward: "account-step-stage--forward animate-[account-step-in-forward]",
  mode: "account-step-stage--mode animate-[account-step-in-mode] [animation-duration:190ms] [animation-timing-function:cubic-bezier(0.16,0.72,0.24,1)]",
} satisfies Record<AuthTransitionDirection, string>;
const accountStepSummaryClassName =
  "account-step-summary grid gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-primary-soft) p-3 text-[13px] font-[750] text-(--color-text-muted) [&_strong]:min-w-0 [&_strong]:[overflow-wrap:anywhere] [&_strong]:text-[15px] [&_strong]:text-(--color-primary-strong)";
const accountFlowSwitchClassName =
  "account-flow-switch m-0 text-center text-[13px] font-[750] text-(--color-text-muted) [&_a]:cursor-pointer [&_a]:border-0 [&_a]:bg-transparent [&_a]:p-0 [&_a]:font-[inherit] [&_a]:font-[850] [&_a]:text-(--color-primary-strong) [&_a]:no-underline [&_a:focus-visible]:underline [&_a:hover]:underline [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:font-[inherit] [&_button]:font-[850] [&_button]:text-(--color-primary-strong) [&_button]:no-underline [&_button:focus-visible]:underline [&_button:hover]:underline";
const accountAlternateActionsClassName = "account-alternate-actions flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[13px] font-[800] max-[520px]:grid max-[520px]:grid-cols-1";
const accountTertiaryActionClassName =
  "account-tertiary-action inline-flex min-h-11 items-center justify-center gap-1.5 rounded-(--radius-sm) border-0 bg-transparent px-2 py-1 text-[13px] font-[850] text-(--color-primary-strong) underline-offset-4 transition-colors duration-150 hover:enabled:underline focus-visible:underline disabled:cursor-not-allowed disabled:text-(--color-text-subtle) [&_.icon]:size-4";

const portalSectionOrder: PortalSection[] = ["dashboard", "trips", "new-trip", "explorer", "todos", "vault", "settings", "sign-out"];
const portalSectionStorageKey = "sagittarius:portal-section-index";

interface CreatedTripShare {
  inviteLink: string;
  joinId: string;
  name: string;
}

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
          <AccountPortalLoadingFrame portalSection={portalSection} />
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

function AccountPortalLoadingFrame({ portalSection }: { portalSection: PortalSection }) {
  const { t } = useI18n();
  const cachedEmail = getLatestAccountPortalDataCache()?.settings?.profile.primaryEmail ?? t.access.dashboard.noEmail;

  return (
    <div className={accountDashboardClassName} id="account-portal" aria-busy="true">
      <AccountPortalNav activeSection={portalSection} email={cachedEmail} />
      <div className={portalContentClassName}>
        <section className={portalLoadingCardClassName}>
          <span className={portalSkeletonTitleClassName} />
          <span className={portalSkeletonLineClassName} />
          <span className={portalSkeletonBlockClassName} />
        </section>
      </div>
    </div>
  );
}

function EmailLoginPanel({
  flow,
  accountClient,
  formError,
  onError,
  onFlowChange,
  onLoggedIn,
  showRouteTabs = false,
}: {
  flow: AuthFlow;
  accountClient: AccountApiClient;
  formError?: string | null;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
  showRouteTabs?: boolean;
}) {
  const { locale, t } = useI18n();
  const activeFlow = flow;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [authStep, setAuthStep] = useState<"email" | "methods" | "password" | "setup">("email");
  const [transitionDirection, setTransitionDirection] = useState<AuthTransitionDirection>("forward");
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [verifiedRegistrationSession, setVerifiedRegistrationSession] = useState<AccountSession | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedEmail = email.trim();
  const isEmailValid = accountEmailPattern.test(normalizedEmail);
  const isEmailInvalid = normalizedEmail.length > 0 && !isEmailValid;
  const passwordReady = password.length >= 8;
  const isPasswordInvalid = password.length > 0 && !passwordReady;
  const otpReady = /^\d{6}$/.test(code);
  const emailInputId = `account-${activeFlow}-email`;
  const emailHintId = `${emailInputId}-hint`;
  const passwordInputId = `account-${activeFlow}-password`;
  const passwordHintId = `${passwordInputId}-hint`;
  const codeInputId = `account-${activeFlow}-code`;
  const codeHintId = `${codeInputId}-hint`;
  const formErrorId = `account-${activeFlow}-error`;
  const passwordAutocomplete = activeFlow === "register" ? "new-password" : "current-password";

  useEffect(() => {
    if (!challenge || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, resendCooldown]);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmailValid || !passwordReady) return;
    onError(null);
    if (activeFlow === "register") {
      await requestEmailCode();
      return;
    }
    await signInWithPassword();
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeFlow === "register") {
      await requestEmailCode();
      return;
    }
    await signInWithPassword();
  }

  async function requestEmailCode() {
    if (!isEmailValid || (activeFlow === "register" && !passwordReady)) return;
    setIsSubmitting(true);
    try {
      const nextChallenge = await accountClient.startEmailLogin(normalizedEmail);
      setTransitionDirection("forward");
      setChallenge(nextChallenge);
      setResendCooldown(30);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.startFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || !otpReady) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishEmailLogin({
        challengeId: challenge.challengeId,
        code,
        trustDevice: activeFlow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      if (activeFlow === "register") {
        setVerifiedRegistrationSession(session);
        goToStep("setup");
        setChallenge(null);
        setCode("");
        onError(null);
        return;
      }
      onLoggedIn(session);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.invalidCode, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verifiedRegistrationSession || !passwordReady) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishPasswordLogin({
        flow: "register",
        email: normalizedEmail,
        password,
        trustDevice: true,
        deviceLabel: "",
      });
      await accountClient.updateSettings(session.sessionToken, {
        displayName: displayName.trim() || normalizedEmail.split("@")[0] || t.access.dashboard.fallbackName,
        avatarColor: "#c2410c",
        locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.passwordRegisterFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPassword() {
    if (!isEmailValid || !passwordReady) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishPasswordLogin({
        flow: activeFlow,
        email: normalizedEmail,
        password,
        trustDevice: activeFlow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(
        activeFlow === "register"
          ? errorMessage(caught, t.access.emailLogin.errors.passwordRegisterFailed, t.access.messages)
          : passwordLoginErrorMessage(caught, t.access.emailLogin.errors.passwordLoginFailed, t.access.messages),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPasskey() {
    if (!isEmailValid) return;
    setIsSubmitting(true);
    try {
      const loginStart = await accountClient.startPasskeyLogin(normalizedEmail);
      const credential = await getPasskeyCredential(loginStart.challenge, loginStart.allowCredentials.map((credential) => credential.credentialId));
      const session = await accountClient.finishPasskeyLogin({
        challengeId: loginStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
        signature: arrayBufferToBase64Url(credential.response.signature),
        trustDevice: activeFlow === "login" ? trustDevice : false,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.passkeyLoginFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetChallenge() {
    setChallenge(null);
    setCode("");
    setPassword("");
    setResendCooldown(0);
    goToStep("email", "back");
    onError(null);
  }

  function changeEmail() {
    resetEntryState("back");
  }

  function resetEntryState(direction: AuthTransitionDirection = "back") {
    setChallenge(null);
    setCode("");
    setPassword("");
    setDisplayName("");
    setHomeBase("");
    setResendCooldown(0);
    setVerifiedRegistrationSession(null);
    goToStep("email", direction);
    onError(null);
  }

  function showPasswordStep() {
    setPassword("");
    goToStep("password");
    onError(null);
  }

  function chooseMethods() {
    goToStep("methods", "back");
    onError(null);
  }

  function goToStep(nextStep: typeof authStep, direction: AuthTransitionDirection = "forward") {
    setTransitionDirection(direction);
    setAuthStep(nextStep);
  }

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  }

  function switchFlow(nextFlow: AuthFlow) {
    if (nextFlow === activeFlow) return;
    onFlowChange?.(nextFlow);
    resetEntryState("mode");
    const nextHref = nextFlow === "register" ? appRoutes.register() : appRoutes.login();
    window.history.replaceState(null, "", nextHref);
  }

  const visualStep = challenge ? "otp" : authStep;
  const stepLabel = activeFlow === "register"
    ? t.access.emailLogin.stepRegister({ current: visualStep === "email" ? 1 : visualStep === "otp" ? 2 : 3, total: 3 })
    : t.access.emailLogin.stepLogin({ current: visualStep === "otp" ? 2 : 1, total: 2 });

  const trustDeviceFields = (
    <label className={accountCheckClassName}>
      <input checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} type="checkbox" suppressHydrationWarning />
      {t.access.emailLogin.trustDevice}
    </label>
  );

  return (
    <div className={cn(accountLoginFlowClassName, showRouteTabs ? accountEntryLoginFlowClassName : "")}>
      {showRouteTabs ? (
        <>
          <LanguageSwitch className={cn(accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName)} />
          <nav className={accountEntryTabsClassName} aria-label={t.access.mainLabels.combined}>
            <button
              type="button"
              className={cn(
                "account-entry-tab grid min-h-[42px] cursor-pointer place-items-center border-0 border-b-[3px] border-solid bg-transparent text-[15px] font-[850] no-underline transition-[border-color,color] duration-[180ms] ease-out",
                activeFlow === "login"
                  ? "account-entry-tab--active border-(--color-primary) text-(--color-primary-strong)"
                  : "border-transparent text-(--color-text-muted)"
              )}
              aria-current={activeFlow === "login" ? "page" : undefined}
              onClick={() => switchFlow("login")}
            >
              {t.access.titles.accountLogin}
            </button>
            <button
              type="button"
              className={cn(
                "account-entry-tab grid min-h-[42px] cursor-pointer place-items-center border-0 border-b-[3px] border-solid bg-transparent text-[15px] font-[850] no-underline transition-[border-color,color] duration-[180ms] ease-out",
                activeFlow === "register"
                  ? "account-entry-tab--active border-(--color-primary) text-(--color-primary-strong)"
                  : "border-transparent text-(--color-text-muted)"
              )}
              aria-current={activeFlow === "register" ? "page" : undefined}
              onClick={() => switchFlow("register")}
            >
              {t.access.titles.accountRegister}
            </button>
          </nav>
        </>
      ) : null}
      <form
        aria-busy={isSubmitting}
        aria-describedby={formError ? formErrorId : undefined}
        className={accountAuthCardClassName}
        onSubmit={authStep === "setup" ? submitSetup : challenge ? submitCode : authStep === "password" ? submitPassword : submitEmail}
      >
        <span className={accountStepKickerClassName}>{stepLabel}</span>
        {formError ? <StatusMessage id={formErrorId} tone="danger">{formError}</StatusMessage> : null}
        <div className={cn(accountStepStageClassName, accountStepStageDirectionClassNames[transitionDirection])} key={visualStep}>
          <PanelHeading
            icon={challenge ? "settings" : authStep === "password" ? "key" : "users"}
            title={challenge ? t.access.emailLogin.verifyTitle : authStep === "setup" ? t.access.emailLogin.setupTitle : authStep === "methods" ? t.access.emailLogin.methodTitle : authStep === "password" ? t.access.emailLogin.passwordTitle : activeFlow === "register" ? t.access.emailLogin.registerCredentialsTitle : t.access.emailLogin.loginCredentialsTitle}
            detail={
              challenge
                ? t.access.emailLogin.expiresAt({ value: formatDateTime(challenge.expiresAt, locale) })
                : authStep === "setup"
                  ? t.access.emailLogin.setupDetail
                  : authStep === "methods"
                    ? t.access.emailLogin.methodDetail
                    : authStep === "password"
                      ? activeFlow === "register" ? t.access.emailLogin.registerPasswordDetail : t.access.emailLogin.passwordDetail
                      : activeFlow === "register" ? t.access.emailLogin.registerCredentialsDetail : t.access.emailLogin.loginCredentialsDetail
            }
          />
          {challenge ? (
            <>
            <div className={accountStepSummaryClassName}>
              <span>{t.access.emailLogin.sentCodeTo}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <div className={accountFieldClassName}>
              <label htmlFor={codeInputId}><span>{t.access.emailLogin.verificationCode}</span></label>
              <input
                id={codeInputId}
                value={code}
                onChange={(event) => updateCode(event.target.value)}
                name="one-time-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                aria-describedby={codeHintId}
                aria-invalid={code.length > 0 && !otpReady ? true : undefined}
                required
                suppressHydrationWarning
              />
              <p className={accountFieldHintClassName} id={codeHintId}>{t.access.emailLogin.verificationCodeHint}</p>
            </div>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={!otpReady || isSubmitting}>
              <Icon name="check" />
              {activeFlow === "register" ? t.access.emailLogin.verifyEmail : t.access.emailLogin.signInAccount}
            </Button>
            <Button type="button" variant="secondary" disabled={!isEmailValid || (activeFlow === "register" && !passwordReady) || isSubmitting || resendCooldown > 0} onClick={() => void requestEmailCode()}>
              {t.access.emailLogin.resendCode}
              {resendCooldown > 0 ? t.access.emailLogin.resendCooldown({ seconds: resendCooldown }) : ""}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={resetChallenge}>
              {t.access.emailLogin.changeEmail}
            </Button>
            </>
          ) : authStep === "email" ? (
            <>
            <div className={accountFieldClassName}>
              <label htmlFor={emailInputId}><span>{t.access.emailLogin.email}</span></label>
              <input
                id={emailInputId}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                name="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="username"
                aria-describedby={emailHintId}
                aria-invalid={isEmailInvalid ? true : undefined}
                spellCheck={false}
                placeholder="you@example.com"
                required
                suppressHydrationWarning
              />
              <p className={accountFieldHintClassName} id={emailHintId}>{isEmailInvalid ? t.access.emailLogin.emailInvalidHint : t.access.emailLogin.emailHint}</p>
            </div>
            <div className={accountFieldClassName}>
              <label htmlFor={passwordInputId}><span>{t.access.emailLogin.password}</span></label>
              <input
                id={passwordInputId}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                name="password"
                type="password"
                autoComplete={passwordAutocomplete}
                aria-describedby={passwordHintId}
                aria-invalid={isPasswordInvalid ? true : undefined}
                minLength={8}
                required
                suppressHydrationWarning
              />
              <p className={accountFieldHintClassName} id={passwordHintId}>{t.access.emailLogin.passwordHint}</p>
            </div>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={!isEmailValid || !passwordReady || isSubmitting}>
              <Icon name={activeFlow === "register" ? "check" : "key"} />
              {activeFlow === "register" ? t.access.emailLogin.createWithPassword : t.access.emailLogin.signInAccount}
            </Button>
            {activeFlow === "login" ? (
              <div className={accountAlternateActionsClassName} aria-label={t.access.emailLogin.alternateSignInOptions}>
                <button className={accountTertiaryActionClassName} type="button" disabled={!isEmailValid || isSubmitting} onClick={() => void requestEmailCode()}>
                  <Icon name="check" />
                  {t.access.emailLogin.useSignInCodeInstead}
                </button>
                <button className={accountTertiaryActionClassName} type="button" disabled={!isEmailValid || isSubmitting} onClick={() => void signInWithPasskey()}>
                  <Icon name="key" />
                  {t.access.emailLogin.usePasskeyInstead}
                </button>
              </div>
            ) : null}
            </>
          ) : authStep === "methods" ? (
            <>
            <div className={accountStepSummaryClassName}>
              <span>{activeFlow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <Button type="button" disabled={isSubmitting} onClick={() => void requestEmailCode()}>
              <Icon name="check" />
              {activeFlow === "register" ? t.access.emailLogin.sendRegisterCode : t.access.emailLogin.sendSignInCode}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={showPasswordStep}>
              <Icon name="key" />
              {activeFlow === "register" ? t.access.emailLogin.createWithPassword : t.access.emailLogin.signInWithPassword}
            </Button>
            {activeFlow === "login" ? (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => void signInWithPasskey()}>
                <Icon name="key" />
                {t.access.emailLogin.signInWithPasskey}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={changeEmail}>
              {t.access.emailLogin.changeEmail}
            </Button>
            </>
          ) : authStep === "setup" ? (
            <>
            <div className={accountStepSummaryClassName}>
              <span>{t.access.emailLogin.createFor}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <label>
              <span>{t.access.emailLogin.displayName}</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" placeholder="Aom Traveler" required suppressHydrationWarning />
            </label>
            <label>
              <span>{t.access.emailLogin.homeBase}</span>
              <input value={homeBase} onChange={(event) => setHomeBase(event.target.value)} autoComplete="address-level2" placeholder="Bangkok" suppressHydrationWarning />
            </label>
            <Button type="submit" disabled={!displayName.trim() || isSubmitting}>
              <Icon name="check" />
              {t.access.emailLogin.finishSetup}
            </Button>
            </>
          ) : (
            <>
            <div className={accountStepSummaryClassName}>
              <span>{activeFlow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <input
              aria-hidden="true"
              autoComplete="username"
              className="sr-only"
              name="email"
              readOnly
              tabIndex={-1}
              type="email"
              value={normalizedEmail}
            />
            <div className={accountFieldClassName}>
              <label htmlFor={`${passwordInputId}-step`}><span>{t.access.emailLogin.password}</span></label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                id={`${passwordInputId}-step`}
                name="password"
                type="password"
                autoComplete={passwordAutocomplete}
                aria-describedby={passwordHintId}
                aria-invalid={isPasswordInvalid ? true : undefined}
                minLength={8}
                required
                suppressHydrationWarning
              />
              <p className={accountFieldHintClassName} id={passwordHintId}>{t.access.emailLogin.passwordHint}</p>
            </div>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={password.length < 8 || isSubmitting}>
              <Icon name="key" />
              {activeFlow === "register" ? t.access.emailLogin.continueToOtp : t.access.emailLogin.signInWithPassword}
            </Button>
            {activeFlow === "login" ? (
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={chooseMethods}>
                {t.access.emailLogin.chooseAnotherMethod}
              </Button>
            ) : (
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={changeEmail}>
                {t.access.emailLogin.changeEmail}
              </Button>
            )}
            </>
          )}
        </div>
      </form>
      {!challenge ? (
        <p className={accountFlowSwitchClassName}>
          {activeFlow === "register" ? (
            <>
              {t.access.emailLogin.hasAccount} <button type="button" onClick={() => switchFlow("login")}>{t.access.emailLogin.signInLink}</button>
            </>
          ) : (
            <>
              {t.access.emailLogin.noAccount} <button type="button" onClick={() => switchFlow("register")}>{t.access.emailLogin.registerLink}</button>
            </>
          )}
        </p>
      ) : null}
    </div>
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
  const defaultOwnerDisplayName = settings?.profile.displayName ?? t.access.dashboard.fallbackName;
  const [tripForm, setTripForm] = useState(() => defaultTripForm(settings?.profile.displayName, settings?.profile));
  const [transitionDirection] = useState<"forward" | "back">(() => {
    const currentIndex = portalSectionOrder.indexOf(portalSection);
    return currentIndex < readPreviousPortalSectionIndex(currentIndex) ? "back" : "forward";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTripShare, setCreatedTripShare] = useState<CreatedTripShare | null>(null);
  const [hasCopiedCreatedInvite, setHasCopiedCreatedInvite] = useState(false);
  const [vaultForm, setVaultForm] = useState<AccountVaultItemCreateRequest>({ kind: "note", title: "", detail: "", externalUrl: "" });
  const [explorerQuery, setExplorerQuery] = useState("");
  const sessionKindLabel = accountSession.kind === "trusted" ? t.access.dashboard.sessionKinds.trusted : t.access.dashboard.sessionKinds.temporary;
  const sharedTrips = trips.filter((trip) => !trip.isOwner);
  const explorerTrips = (sharedTrips.length ? sharedTrips : trips).filter((trip) => {
    const query = explorerQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return `${trip.name} ${trip.destinationLabel} ${trip.role}`.toLocaleLowerCase().includes(query);
  });

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
      await onCreatedTrip(response.memberSession, { openTrip: portalSection !== "new-trip" });
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

  async function submitVaultItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = vaultForm.title.trim();
    if (!title) return;
    try {
      const item = await accountClient.createVaultItem(accountSession.sessionToken, {
        ...vaultForm,
        title,
        detail: vaultForm.detail.trim(),
        externalUrl: vaultForm.externalUrl?.trim() || null,
      });
      onVaultItemCreated(item);
      setVaultForm({ kind: "note", title: "", detail: "", externalUrl: "" });
      onMessage(t.access.portal.vaultCreate.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.portal.vaultCreate.error, t.access.messages));
    }
  }

  async function registerPasskey() {
    if (!settings) return;
    try {
      const registrationStart = await accountClient.startPasskeyRegistration(accountSession.sessionToken);
      const credential = await createPasskeyCredential(registrationStart.challenge, settings);
      const passkey = await accountClient.finishPasskeyRegistration(accountSession.sessionToken, {
        challengeId: registrationStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
        nickname: `${settings.profile.displayName} passkey`,
      });
      onSettingsChanged({
        ...settings,
        passkeys: [passkey, ...settings.passkeys.filter((candidate) => candidate.id !== passkey.id)],
      });
      onMessage(t.access.settings.messages.passkeyCreated);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.passkeyFailed, t.access.messages));
    }
  }

  const activePortalSection = portalSection === "new-trip" ? "trips" : portalSection;
  const currentPortalSectionIndex = portalSectionOrder.indexOf(portalSection);

  useEffect(() => {
    window.sessionStorage.setItem(portalSectionStorageKey, String(currentPortalSectionIndex));
  }, [currentPortalSectionIndex]);

  return (
    <div className={accountDashboardClassName} id="account-portal" data-transition-direction={transitionDirection}>
      <AccountPortalNav activeSection={activePortalSection} email={settings?.profile.primaryEmail ?? t.access.dashboard.noEmail} />

      <div className={portalContentClassName}>
        {portalSection === "dashboard" ? <section className={portalProfileCardClassName} id="portal-dashboard">
          <PanelHeading icon="home" title={t.access.portal.sections.dashboard.title} detail={t.access.portal.sections.dashboard.detail} />
          <div className={accountProfileRowClassName}>
            <span className={accountAvatarClassName} style={{ backgroundColor: settings?.profile.avatarColor ?? "#c2410c" }} aria-hidden="true">
              {(settings?.profile.displayName ?? t.access.dashboard.fallbackName).slice(0, 1)}
            </span>
            <div>
              <strong>{settings?.profile.displayName ?? t.access.dashboard.fallbackName}</strong>
              <span>{settings?.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
            </div>
            <Badge tone={accountSession.kind === "trusted" ? "success" : "warning"}>{sessionKindLabel}</Badge>
          </div>
          <div className={accountStatGridClassName}>
            {isLoading && !stats ? (
              <PortalStatSkeleton />
            ) : (
              <>
                <Stat label={t.access.dashboard.stats.trips} value={stats?.tripsTotal ?? 0} />
                <Stat label={t.access.dashboard.stats.owned} value={stats?.tripsOwned ?? 0} />
                <Stat label={t.access.dashboard.stats.active} value={stats?.activeTrips ?? 0} />
                <Stat label={t.access.dashboard.stats.claims} value={stats?.tempClaimsCompleted ?? 0} />
              </>
            )}
          </div>
        </section> : null}

        {portalSection === "trips" ? <section className={portalHistoryCardClassName} id="portal-trips">
          <div className={portalSectionToplineClassName}>
            <PanelHeading
              icon="calendar"
              title={t.access.portal.sections.trips.title}
              detail={isLoading ? t.access.dashboard.history.loading : t.access.dashboard.history.visibleTrips({ count: trips.length })}
            />
            <Button asChild>
              <Link href={appRoutes.portalNewTrip()}>
                <Icon name="plus" />
                Create trip
              </Link>
            </Button>
          </div>
          {isLoading && !trips.length ? (
            <PortalListSkeleton rows={2} />
          ) : trips.length ? (
            <div className={accountTripListClassName}>
              {trips.map((trip) => (
                <article className={accountTripRowClassName} key={trip.id}>
                  <span className={accountTripIconClassName} aria-hidden="true"><Icon name="location" /></span>
                  <div>
                    <strong>{trip.name}</strong>
                    <span>{trip.destinationLabel} · {trip.startDate} - {trip.endDate}</span>
                  </div>
                  <Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? t.access.dashboard.history.owner : t.appShell.roles[trip.role]}</Badge>
                  <Button asChild variant="secondary">
                    <Link href={appRoutes.tripOverview(trip.id)}>
                      <Icon name="chevronRight" />
                      Open
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              actionHref={appRoutes.portalNewTrip()}
              actionLabel={t.access.portal.emptyStates.trips.action}
              detail={t.access.portal.emptyStates.trips.detail}
              icon="plus"
              title={t.access.portal.emptyStates.trips.title}
            />
          )}
        </section> : null}

        {portalSection === "new-trip" ? <section className={cn(portalHistoryCardClassName, portalNewTripCardClassName)} id="portal-new-trip">
          <div className={tripBuilderTopbarClassName} style={{ position: "relative", zIndex: 100 }}>
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
            <section className={tripCreatedShareClassName} role="region" aria-label="Created trip share link">
              <strong>{createdTripShare.name} is ready to share.</strong>
              <span>Invite link: <code>{createdTripShare.inviteLink}</code></span>
              <div>
                <Button type="button" variant="secondary" onClick={() => void copyCreatedInviteLink()}>
                  {hasCopiedCreatedInvite ? "Copied" : "Copy invite link"}
                </Button>
                <a className={tripCreatedShareLinkClassName} href={buildInviteEmailHref(createdTripShare.name, createdTripShare.inviteLink)}>
                  Send email
                </a>
              </div>
            </section>
          ) : null}
          <PortalTripWizard
            defaultOwnerDisplayName={defaultOwnerDisplayName}
            isSubmitting={isSubmitting}
            tripForm={tripForm}
            onChange={setTripForm}
            onSubmit={submitTrip}
          />
        </section> : null}

        {portalSection === "explorer" ? <section className={cn(portalFeatureCardClassName, "portal-explorer-card")} id="portal-explorer">
          <PanelHeading icon="map" title={t.access.portal.sections.explorer.title} detail="Find shared trips from people in your system." />
          {isLoading && !explorer ? <PortalListSkeleton rows={1} compact /> : (
            <div className={accountSettingsGridClassName}>
              <SettingLine label={t.access.portal.explorerStats.upcoming} value={`${explorer?.upcomingTrips ?? 0}`} />
              <SettingLine label={t.access.portal.explorerStats.destinations} value={`${explorer?.destinationCount ?? 0}`} />
            </div>
          )}
          {explorer?.nextTrip ? (
            <div className={accountStepSummaryClassName}>
              <span>{t.access.portal.explorerStats.nextTrip}</span>
              <strong>{explorer.nextTrip.name}</strong>
            </div>
          ) : null}
          <div className={portalSearchClassName}>
            <Icon name="map" />
            <input
              aria-label="Search shared trips"
              placeholder="Search city, trip, or role"
              value={explorerQuery}
              onChange={(event) => setExplorerQuery(event.target.value)}
            />
          </div>
          <div className={portalMapPreviewClassName} aria-label="Shared trip map preview">
            {explorerTrips.slice(0, 4).map((trip, index) => (
              <span
                className={portalMapPinClassName}
                key={trip.id}
                style={{ "--pin-x": `${22 + index * 17}%`, "--pin-y": `${32 + (index % 2) * 26}%` } as CSSProperties}
                title={`${trip.name}, ${trip.destinationLabel}`}
              >
                <Icon name="location" />
              </span>
            ))}
          </div>
          {explorerTrips.length ? (
            <div className={accountTripListClassName}>
              {explorerTrips.map((trip) => (
                <article className={accountTripRowClassName} key={trip.id}>
                  <span className={accountTripIconClassName} aria-hidden="true"><Icon name="map" /></span>
                  <div>
                    <strong>{trip.name}</strong>
                    <span>{trip.destinationLabel} · {trip.startDate} - {trip.endDate}</span>
                  </div>
                  <Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? "Owned" : "Shared"}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              actionHref={appRoutes.portalNewTrip()}
              actionLabel={t.access.portal.emptyStates.explorer.action}
              detail={explorerQuery.trim() ? t.access.portal.emptyStates.explorer.noMatchesDetail : t.access.portal.emptyStates.explorer.detail}
              icon="map"
              title={explorerQuery.trim() ? t.access.portal.emptyStates.explorer.noMatchesTitle : t.access.portal.emptyStates.explorer.title}
            />
          )}
        </section> : null}

        {portalSection === "todos" ? <section className={portalFeatureCardClassName} id="portal-to-dos">
          <PanelHeading icon="list" title={t.access.portal.sections.todos.title} detail={t.access.portal.sections.todos.detail} />
          {isLoading && !todos.length ? (
            <PortalListSkeleton rows={1} />
          ) : todos.length ? (
            <div className={accountTripListClassName}>
              {todos.map((todo) => (
                <article className={accountTripRowClassName} key={todo.id}>
                  <span className={accountTripIconClassName} aria-hidden="true"><Icon name="list" /></span>
                  <div>
                    <strong>{todo.title}</strong>
                    <span>{todo.tripName} · {todo.visibility} · {todo.kind ?? "prep"}</span>
                  </div>
                  <Badge tone={todo.status === "done" ? "success" : "warning"}>{todo.status}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              actionHref={appRoutes.portalNewTrip()}
              actionLabel={t.access.portal.emptyStates.todos.action}
              detail={t.access.portal.emptyStates.todos.detail}
              icon="list"
              title={t.access.portal.emptyStates.todos.title}
            />
          )}
        </section> : null}

        {portalSection === "vault" ? <section className={portalFeatureCardClassName} id="portal-vault">
          <PanelHeading icon="document" title={t.access.portal.sections.vault.title} detail={t.access.portal.sections.vault.detail} />
          <div className={cloudProviderPanelClassName} aria-label="Cloud provider options">
            <div>
              <strong>Use your own cloud</strong>
              <span id="cloud-provider-status">Link paste only for now. Save a provider URL in the external link field; direct cloud connection is not enabled yet.</span>
            </div>
            <div className={cloudProviderGridClassName}>
              {["Google Drive", "iCloud", "Dropbox", "OneDrive"].map((provider) => (
                <button
                  aria-describedby="cloud-provider-status"
                  className={cloudProviderButtonClassName}
                  disabled
                  type="button"
                  key={provider}
                >
                  <Icon name="cloud" />
                  {provider}
                  <span className="sr-only">link paste only</span>
                </button>
              ))}
            </div>
          </div>
          <form className={accountSettingsFormClassName} onSubmit={submitVaultItem}>
            <div className={accountTwoColClassName}>
              <label>
                <span>{t.access.portal.vaultCreate.kind}</span>
                <Select value={vaultForm.kind} onChange={(event) => setVaultForm((current) => ({ ...current, kind: event.target.value as "note" | "file" }))}>
                  <option value="note">{t.access.portal.vaultCreate.note}</option>
                  <option value="file">{t.access.portal.vaultCreate.file}</option>
                </Select>
              </label>
              <label>
                <span>{t.access.portal.vaultCreate.title}</span>
                <input value={vaultForm.title} onChange={(event) => setVaultForm((current) => ({ ...current, title: event.target.value }))} required />
              </label>
            </div>
            <label>
              <span>{t.access.portal.vaultCreate.detail}</span>
              <input value={vaultForm.detail} onChange={(event) => setVaultForm((current) => ({ ...current, detail: event.target.value }))} />
            </label>
            <label>
              <span>{t.access.portal.vaultCreate.externalUrl}</span>
              <input
                value={vaultForm.externalUrl ?? ""}
                onChange={(event) => setVaultForm((current) => ({ ...current, externalUrl: event.target.value }))}
                placeholder="https://drive.google.com/..."
                type="url"
              />
            </label>
            <Button type="submit"><Icon name="plus" />{t.access.portal.vaultCreate.submit}</Button>
          </form>
          {isLoading && !vaultItems.length ? (
            <PortalListSkeleton rows={1} />
          ) : vaultItems.length ? (
            <div className={accountTripListClassName}>
              {vaultItems.map((item) => (
                <article className={accountTripRowClassName} key={`${item.source}-${item.id}`}>
                  <span className={accountTripIconClassName} aria-hidden="true"><Icon name={item.kind === "file" ? "document" : "note"} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.tripName ?? t.access.portal.vaultCreate.personal} · {item.detail}</span>
                  </div>
                  <Badge tone={item.kind === "file" ? "neutral" : "success"}>{item.kind}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className={accountEmptyClassName}>{t.access.portal.sections.vault.empty}</p>
          )}
        </section> : null}

        {portalSection === "settings" ? <section className={portalSettingsCardClassName} id="portal-settings">
          <PanelHeading icon="settings" title={t.access.settings.title} detail={t.access.settings.detail} />
          {settings ? (
            <AccountSettingsEditor
              accountClient={accountClient}
              accountSession={accountSession}
              classNames={{
                avatar: accountAvatarClassName,
                deviceList: accountDeviceListClassName,
                deviceRow: accountDeviceRowClassName,
                empty: accountEmptyClassName,
                profilePreview: settingsProfilePreviewClassName,
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
          ) : (
            <p className={accountEmptyClassName}>{t.access.settings.loading}</p>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={!settings}
            onClick={() => void registerPasskey()}
          >
            <Icon name="key" />
            {t.access.settings.startPasskeySetup}
          </Button>
        </section> : null}

        {portalSection === "sign-out" ? <section className={portalProfileCardClassName} id="portal-sign-out">
          <PanelHeading icon="x" title={t.access.portal.sections.signOut.title} detail={t.access.portal.sections.signOut.detail} />
          <Button type="button" variant="secondary" onClick={() => void onLogout()}>
            <Icon name="x" />
            {t.access.dashboard.logout}
          </Button>
        </section> : null}
      </div>
    </div>
  );
}

function readPreviousPortalSectionIndex(fallbackIndex: number): number {
  if (typeof window === "undefined") return fallbackIndex;
  const storedIndex = Number(window.sessionStorage.getItem(portalSectionStorageKey));
  return Number.isFinite(storedIndex) ? storedIndex : fallbackIndex;
}

function StatusMessage({ children, id, tone }: { children: ReactNode; id?: string; tone: "danger" | "success" }) {
  return (
    <p className={tone === "danger" ? accountDangerStatusClassName : accountSuccessStatusClassName} id={id} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={tone === "danger" ? "alertCircle" : "check"} />
      {children}
    </p>
  );
}
