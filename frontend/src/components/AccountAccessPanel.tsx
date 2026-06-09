"use client";

import { ComponentProps, CSSProperties, Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type {
  AccountApiClient,
  AccountSession,
  AccountExplorerSummary,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTodoSummary,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import { appRoutes } from "@/src/routes/app-routes";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripCity, TripParticipantSession } from "@/src/trip/types";
import { Badge, Button } from "./ui";
import { Icon } from "./icons";
import { DatePickerField } from "./DateTimePickers";
import { TripJoinGate } from "./TripJoinGate";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import { cn } from "@/src/lib/cn";

interface AccountAccessPanelProps {
  accessMode?: "combined" | "account-login" | "account-register" | "account-portal" | "trip-access";
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
type PortalSection = "dashboard" | "trips" | "new-trip" | "explorer" | "todos" | "vault" | "settings" | "sign-out";
type TripContinent = "all" | "asia" | "europe" | "north-america" | "south-america" | "oceania" | "africa";

const accountEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const accountAvatarClassName = "person-avatar grid size-[30px] place-items-center rounded-full text-xs font-extrabold text-white";
const accountDangerStatusClassName = "join-alert m-0 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2.5 text-[13px] font-bold text-(--color-danger)";
const accountSuccessStatusClassName =
  "account-success m-0 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-success-border) bg-(--color-success-soft) px-3 py-2.5 text-[13px] font-extrabold text-(--color-success)";
const accountToastStackClassName =
  "account-toast-stack pointer-events-none fixed bottom-6 right-[clamp(18px,4vw,44px)] z-[50] grid w-[min(420px,calc(100vw_-_40px))] gap-2.5 max-[767px]:inset-x-[18px] max-[767px]:bottom-5 max-[767px]:w-auto [&_.account-success]:pointer-events-auto [&_.account-success]:min-h-12 [&_.account-success]:w-full [&_.account-success]:justify-start [&_.account-success]:rounded-(--radius-lg) [&_.account-success]:bg-[linear-gradient(90deg,rgb(22_163_74_/_0.08),rgb(255_255_255_/_0.96)_42%),rgb(255_255_255_/_0.96)] [&_.account-success]:shadow-[0_18px_44px_rgb(15_23_42_/_0.14)] [&_.join-alert]:pointer-events-auto [&_.join-alert]:min-h-12 [&_.join-alert]:w-full [&_.join-alert]:justify-start [&_.join-alert]:rounded-(--radius-lg) [&_.join-alert]:bg-[linear-gradient(90deg,rgb(220_38_38_/_0.08),rgb(255_255_255_/_0.96)_42%),rgb(255_255_255_/_0.96)] [&_.join-alert]:shadow-[0_18px_44px_rgb(15_23_42_/_0.14)] [&>*]:account-toast-item";
const accountPageClassName =
  "account-page min-h-screen bg-[var(--paper-grain),var(--watercolor-page-wash),var(--color-page)] p-7";
const accountEntryPageClassName =
  "account-page--entry grid items-center bg-[linear-gradient(90deg,rgb(255_255_255_/_0.84),rgb(255_255_255_/_0.96)_50%,rgb(255_255_255_/_0.98)),var(--paper-grain),#ffffff] p-[clamp(18px,4vw,44px)] max-[767px]:items-start max-[767px]:p-[18px]";
const accountTripAccessPageClassName =
  "account-page--trip-access grid items-center overflow-x-clip bg-[linear-gradient(180deg,rgb(255_255_255_/_0.84),rgb(240_253_250_/_0.56)_56%,rgb(255_247_237_/_0.42)),linear-gradient(90deg,rgb(37_99_235_/_0.055)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.045)_1px,transparent_1px),var(--paper-grain),var(--color-page)] bg-[length:auto,58px_58px,58px_58px,auto,auto] p-[clamp(18px,4vw,42px)] max-[767px]:items-start max-[767px]:p-3.5";
const accountPortalPageClassName = "account-page--portal overflow-x-clip pt-[18px] max-[767px]:p-3.5";
const accountPortalNewTripPageClassName =
  "account-page--portal-new-trip !bg-[linear-gradient(90deg,rgb(255_255_255_/_0.86),rgb(248_250_252_/_0.72)),var(--color-page)] !pt-3.5 max-[767px]:!p-2.5 [&_.account-dashboard]:!block [&_.account-hero]:hidden [&_.portal-content]:!block [&_.portal-content]:!min-h-0 [&_.portal-nav]:hidden";
const accountShellClassName = "account-shell relative mx-auto grid w-[min(100%,1180px)] gap-4 [&>*]:relative";
const accountPortalShellClassName = "gap-3.5";
const accountPortalNewTripShellClassName = "!w-[min(100%,1488px)] !gap-0 max-[767px]:!w-full";
const accountTripAccessShellClassName = "w-[min(100%,1120px)]";
const accountEntryShellClassName =
  "account-shell--entry relative w-[min(100%,1240px)] grid-cols-[minmax(610px,1.08fr)_minmax(380px,0.92fr)] grid-rows-[auto_auto_1fr] items-center gap-x-7 gap-y-3.5 max-[767px]:grid-cols-1 max-[767px]:grid-rows-[auto_auto] max-[767px]:gap-3.5";
const tripAccessLanguageSwitchClassName =
  "trip-access-language-switch !right-4 !top-4 !z-[5] !m-0 !w-fit !bg-[rgb(255_255_255_/_0.92)] !shadow-[0_10px_24px_rgb(15_23_42_/_0.08)] max-[767px]:!right-[26px] max-[767px]:!top-[26px]";
const accessLanguageSwitchClassName = "access-language-switch mt-3.5";
const accountEntryLanguageSwitchClassName =
  "account-entry-language-switch !absolute !right-4 !top-4 !z-[2] !m-0 !w-fit !bg-[rgb(255_255_255_/_0.9)] !shadow-[0_10px_24px_rgb(15_23_42_/_0.08)] max-[767px]:!right-7 max-[767px]:!top-7";
const backHomeButtonClassName =
  "back-home-button inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] px-3 py-1.5 text-[0.78rem] font-[850] text-(--color-text-muted) no-underline transition-all duration-150 hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) hover:border-(--color-primary-border) hover:shadow-[0_8px_18px_rgb(15_118_110_/_0.08)] focus-visible:bg-(--color-primary-soft) focus-visible:text-(--color-primary-strong) focus-visible:border-(--color-primary-border)";
const accountEntryBackHomeClassName =
  "account-entry-back-home !absolute !left-11 !top-11 !z-[2] !m-0 !w-fit !bg-[rgb(255_255_255_/_0.9)] !shadow-[0_10px_24px_rgb(15_23_42_/_0.08)] max-[767px]:!left-7 max-[767px]:!top-7";
const tripAccessBackHomeClassName =
  "trip-access-back-home !absolute !left-4 !top-4 !z-[5] !m-0 !w-fit !bg-[rgb(255_255_255_/_0.92)] !shadow-[0_10px_24px_rgb(15_23_42_/_0.08)] max-[767px]:!left-[26px] max-[767px]:!top-[26px]";
const accountHeroClassName =
  "account-hero relative grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3.5 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-[rgb(255_255_255_/_0.94)] p-[18px] shadow-[var(--shadow-panel)] [.account-shell--entry_&]:col-start-1 [.account-shell--entry_&]:row-span-3 [.account-shell--entry_&]:row-start-1 [.account-shell--entry_&]:min-h-[clamp(560px,76vh,680px)] [.account-shell--entry_&]:grid-rows-[auto_auto_1fr] [.account-shell--entry_&]:content-between [.account-shell--entry_&]:overflow-visible [.account-shell--entry_&]:border-transparent [.account-shell--entry_&]:bg-transparent [.account-shell--entry_&]:p-[clamp(44px,6vw,64px)] [.account-shell--entry_&]:shadow-none max-[767px]:[.account-shell--entry_&]:col-start-1 max-[767px]:[.account-shell--entry_&]:row-start-2 max-[767px]:[.account-shell--entry_&]:min-h-0 max-[767px]:[.account-shell--entry_&]:grid-cols-[52px_minmax(0,1fr)] max-[767px]:[.account-shell--entry_&]:gap-3.5 max-[767px]:[.account-shell--entry_&]:overflow-hidden max-[767px]:[.account-shell--entry_&]:p-5 max-[767px]:[.account-shell--entry_&]:pt-5 max-[767px]:[.account-shell--entry_&]:hidden [.account-shell--entry_&>*]:z-[1] [.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:max-w-[330px] max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:max-w-none max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:text-[13px] max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:leading-5 [&_h1]:m-0 [&_h1]:text-3xl [&_h1]:leading-[38px] [&_h1]:text-(--color-text) [.account-shell--entry_&_.join-mark]:absolute [.account-shell--entry_&_.join-mark]:left-11 [.account-shell--entry_&_.join-mark]:top-[108px] max-[767px]:[.account-shell--entry_&_.join-mark]:relative max-[767px]:[.account-shell--entry_&_.join-mark]:inset-auto [.account-shell--entry_&_.join-mark+div]:absolute [.account-shell--entry_&_.join-mark+div]:left-[116px] [.account-shell--entry_&_.join-mark+div]:top-[118px] [.account-shell--entry_&_.join-mark+div]:w-[400px] max-[767px]:[.account-shell--entry_&_.join-mark+div]:relative max-[767px]:[.account-shell--entry_&_.join-mark+div]:inset-auto max-[767px]:[.account-shell--entry_&_.join-mark+div]:w-auto [.account-shell--entry_&_.account-travel-collage]:absolute [.account-shell--entry_&_.account-travel-collage]:col-span-full [.account-shell--entry_&_.account-travel-collage]:row-span-full [.account-shell--entry_&_.account-travel-collage]:right-[clamp(-70px,-5vw,-52px)] [.account-shell--entry_&_.account-travel-collage]:top-[118px] [.account-shell--entry_&_.account-travel-collage]:z-[1] [.account-shell--entry_&_.account-travel-collage]:h-[590px] [.account-shell--entry_&_.account-travel-collage]:w-[330px] [.account-shell--entry_&_.account-travel-collage]:pointer-events-none max-[767px]:[.account-shell--entry_&_.account-travel-collage]:hidden [.account-shell--entry_&_h1]:mt-7 [.account-shell--entry_&_h1]:max-w-[400px] [.account-shell--entry_&_h1]:text-[clamp(40px,3.6vw,52px)] [.account-shell--entry_&_h1]:leading-[1.08] max-[767px]:[.account-shell--entry_&_h1]:mt-2 max-[767px]:[.account-shell--entry_&_h1]:max-w-none max-[767px]:[.account-shell--entry_&_h1]:text-3xl max-[767px]:[.account-shell--entry_&_h1]:leading-[34px] [&_p:not(.join-eyebrow)]:mt-1 [&_p:not(.join-eyebrow)]:mb-0 [&_p:not(.join-eyebrow)]:max-w-[720px] [&_p:not(.join-eyebrow)]:text-sm [&_p:not(.join-eyebrow)]:leading-[22px] [&_p:not(.join-eyebrow)]:text-(--color-text-muted)";
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
  "account-card grid gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-[rgb(255_255_255_/_0.94)] p-4 shadow-[var(--shadow-panel)]";
const portalLoadingCardClassName = cn(accountCardClassName, "portal-loading-card col-span-2 min-h-[220px] max-[767px]:col-auto");
const portalSkeletonBaseClassName =
  "portal-skeleton block overflow-hidden rounded-(--radius-md) bg-[linear-gradient(90deg,var(--color-surface-subtle),rgb(226_232_240_/_0.72),var(--color-surface-subtle))] bg-[length:220%_100%] animate-[portal-skeleton-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none";
const portalSkeletonTitleClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--title h-7 w-[min(220px,48%)]");
const portalSkeletonLineClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--line h-4 w-[min(520px,72%)]");
const portalSkeletonBlockClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--block h-[132px] w-full");
const portalSkeletonNumberClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--number h-[26px] w-[34px]");
const portalSkeletonShortClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--short h-3.5 w-24");
const portalSkeletonIconClassName = cn(portalSkeletonBaseClassName, "portal-skeleton--icon size-9");
const accountStatClassName =
  "account-stat grid min-h-[66px] content-center gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-(--color-text-muted) [&_strong]:text-2xl [&_strong]:leading-7 [&_strong]:text-(--color-text)";
const portalSkeletonCardClassName = cn(accountStatClassName, "portal-skeleton-card");
const portalListSkeletonClassName = "portal-list-skeleton grid gap-2";
const portalListSkeletonCompactClassName = cn(portalListSkeletonClassName, "portal-list-skeleton--compact grid-cols-2 max-[520px]:grid-cols-1");
const portalSkeletonRowClassName =
  "portal-skeleton-row grid min-h-[62px] grid-cols-[36px_minmax(0,1fr)_96px] items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
const accountAuthHighlightsClassName =
  "account-auth-highlights absolute bottom-[76px] left-11 z-[2] col-span-full grid w-[330px] list-none gap-[18px] self-end border-t-0 p-0 m-[clamp(24px,7vh,64px)_0_0] max-[767px]:relative max-[767px]:inset-auto max-[767px]:w-auto max-[767px]:gap-3 max-[767px]:mt-[18px]";
const accountAuthHighlightClassName =
  "account-auth-highlight grid min-h-[54px] grid-cols-[42px_minmax(0,1fr)] items-start gap-3.5 border-b-0 bg-transparent p-0 text-(--color-text) max-[767px]:min-h-0 [&_.icon]:size-8 [&_.icon]:rounded-full [&_.icon]:border-2 [&_.icon]:border-current [&_.icon]:p-[5px] [&_.icon]:text-(--color-primary-strong) [&_small]:mt-0.5 [&_small]:block [&_small]:text-xs [&_small]:font-[650] [&_small]:leading-[18px] [&_small]:text-(--color-text-muted) [&_span]:min-w-0 [&_span]:text-[13px] [&_span]:font-extrabold [&_span]:leading-[19px] [&_span]:text-(--color-text) [&_strong]:block [&_strong]:text-sm [&_strong]:leading-[19px] [&_strong]:text-(--color-text)";
const travelPhotoCardClassName =
  "travel-photo-card absolute block overflow-hidden rounded-[10px] border-4 border-[rgb(255_255_255_/_0.92)] bg-white shadow-[0_14px_30px_rgb(15_23_42_/_0.16)] rotate-[var(--card-rotate)] [animation:travel-card-enter_620ms_cubic-bezier(0.2,0.75,0.25,1)_both,travel-card-float_7s_ease-in-out_infinite] [animation-delay:var(--travel-delay,0ms),calc(var(--travel-delay,0ms)+680ms)] after:absolute after:inset-x-0 after:bottom-0 after:h-[54px] after:bg-[linear-gradient(180deg,transparent,rgb(255_255_255_/_0.9))] after:content-[''] motion-reduce:animate-none";
const travelPhotoImageClassName = "travel-photo-image block size-full object-cover";
const travelPhotoHeartClassName =
  "travel-photo-heart absolute right-[11px] top-[11px] z-[2] size-[18px] rounded-full border-2 border-white drop-shadow-[0_1px_2px_rgb(15_23_42_/_0.2)]";
const travelPhotoCaptionClassName =
  "travel-photo-caption absolute inset-x-2.5 bottom-[9px] z-[2] text-[10px] font-[850] text-(--color-text)";
const travelPhotoCardVariants: Record<string, string> = {
  cappadocia: "travel-photo-card--cappadocia right-1.5 top-[240px] h-[154px] w-[208px] [--card-rotate:-4deg] [--float-rotate:-0.7deg] [--float-x:-7px] [--float-y:5px] [--travel-delay:160ms]",
  krabi: "travel-photo-card--krabi right-[-6px] top-2 h-44 w-[146px] [--card-rotate:5deg] [--float-rotate:0.8deg] [--float-x:6px] [--float-y:-8px] [--travel-delay:70ms]",
  kyoto: "travel-photo-card--kyoto right-[100px] top-[366px] h-[148px] w-[172px] [--card-rotate:-2deg] [--float-rotate:-0.5deg] [--float-x:5px] [--float-y:6px] [--travel-delay:240ms]",
  santorini: "travel-photo-card--santorini right-2 top-[348px] h-[146px] w-[184px] [--card-rotate:2deg] [--float-rotate:0.6deg] [--float-x:-6px] [--float-y:-5px] [--travel-delay:320ms]",
};
const travelNextCardClassName =
  "travel-next-card absolute right-0 top-[504px] grid min-h-[72px] w-[196px] grid-cols-[40px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] border border-[rgb(255_255_255_/_0.92)] bg-[rgb(255_255_255_/_0.94)] p-3 shadow-[0_14px_30px_rgb(15_23_42_/_0.16)] [--float-x:4px] [--float-y:-4px] [animation:travel-card-enter_620ms_cubic-bezier(0.2,0.75,0.25,1)_420ms_both,travel-card-float_7s_ease-in-out_1s_infinite] motion-reduce:animate-none [&_.icon]:size-[34px] [&_.icon]:rounded-full [&_.icon]:bg-(--color-primary-soft) [&_.icon]:p-2 [&_.icon]:text-(--color-primary-strong) [&_small]:block [&_small]:min-w-0 [&_small]:text-[10px] [&_small]:leading-[15px] [&_small]:text-(--color-text-muted) [&_strong]:block [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-xs [&_strong]:leading-4 [&_strong]:text-(--color-text)";
const accountModeTabsClassName =
  "account-mode-tabs inline-grid w-[min(100%,420px)] grid-cols-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-1";
const accountTabClassName =
  "account-tab inline-flex min-h-[42px] items-center justify-center gap-2 rounded-(--radius-md) border-0 bg-transparent font-extrabold text-(--color-text-muted) transition-[background,color] duration-[180ms] ease-out";
const accountTabActiveClassName = "account-tab--active bg-(--color-primary-soft) text-(--color-primary-strong)";
const accountEntryTabsClassName = "account-entry-tabs grid grid-cols-2 gap-0 border-b border-(--color-border) px-[34px] pb-3.5";
const portalNavClassName =
  "portal-nav sticky top-4 grid gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-[var(--shadow-soft)] max-[767px]:static max-[767px]:gap-2.5 max-[767px]:p-2.5";
const portalNavBrandClassName =
  "portal-nav-brand flex min-w-0 items-center gap-2.5 max-[767px]:px-1 max-[767px]:pt-0.5 [&_span]:block [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-xs [&_span]:font-[750] [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-(--color-text)";
const portalNavLinksClassName =
  "portal-nav-links grid gap-2.5 max-[767px]:-mx-1 max-[767px]:flex max-[767px]:flex-nowrap max-[767px]:gap-2 max-[767px]:overflow-x-auto max-[767px]:overscroll-x-contain max-[767px]:px-1 max-[767px]:pb-0.5 max-[767px]:[scrollbar-width:none] max-[767px]:[&::-webkit-scrollbar]:hidden max-[767px]:[mask-image:linear-gradient(to_right,#000_82%,transparent)]";
const portalNavLinkClassName =
  "portal-nav-link flex min-h-[42px] w-full items-center gap-2.5 rounded-(--radius-md) border border-transparent bg-transparent px-2.5 text-left text-[13px] font-[850] text-(--color-text-muted) no-underline transition-[border-color,background,color,box-shadow,transform] duration-[180ms] ease-out hover:translate-x-0.5 hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) hover:shadow-[0_8px_18px_rgb(15_118_110_/_0.08)] focus-visible:translate-x-0.5 focus-visible:border-(--color-primary-border) focus-visible:bg-(--color-primary-soft) focus-visible:text-(--color-primary-strong) focus-visible:shadow-[0_8px_18px_rgb(15_118_110_/_0.08)] max-[767px]:w-auto max-[767px]:min-w-[116px] max-[767px]:shrink-0 max-[767px]:justify-center max-[767px]:hover:translate-x-0 max-[767px]:focus-visible:translate-x-0";
const portalNavLinkActiveClassName = "portal-nav-link--active border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)";
const accountDashboardClassName = "account-dashboard grid grid-cols-[220px_minmax(0,1fr)] items-start gap-3.5 max-[767px]:grid-cols-1";
const portalContentClassName = "portal-content grid min-h-[460px] grid-cols-2 items-start gap-2.5 max-[767px]:min-h-[520px] max-[767px]:grid-cols-1";
const portalProfileCardClassName = cn(accountCardClassName, "account-profile-card col-span-2 max-[767px]:col-auto");
const portalHistoryCardClassName = cn(accountCardClassName, "account-history col-span-2 max-[767px]:col-auto");
const portalNewTripCardClassName =
  "portal-new-trip-card !gap-[18px] !min-h-[calc(100vh-28px)] !overflow-visible !rounded-[16px] !border !border-[rgb(226_232_240_/_0.72)] !bg-[#ffffff] !p-[18px] !shadow-[0_12px_28px_rgb(15_23_42_/_0.07)] max-[767px]:!min-h-[calc(100vh-20px)] max-[767px]:!rounded-none max-[767px]:!border-0 max-[767px]:!p-0 max-[767px]:!shadow-none";
const tripBuilderTopbarClassName =
  "trip-builder-topbar grid grid-cols-[132px_minmax(0,1fr)_auto] items-center gap-7 pb-[18px] max-[767px]:grid-cols-[1fr_auto] max-[767px]:gap-2.5 [&>.badge]:mt-2 [&>.badge]:justify-self-end [&>.button]:min-h-[58px] [&>.button]:rounded-[9px] [&>.button]:bg-[rgb(255_255_255_/_0.88)] [&>.button]:shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] max-[767px]:[&>.button]:w-auto max-[767px]:[&>.button]:min-w-[118px] [&>.trip-builder-title]:grid [&>.trip-builder-title]:min-w-0 [&>.trip-builder-title]:justify-self-start [&>.trip-builder-title]:gap-0.5 [&>.trip-builder-title]:text-left max-[767px]:[&>.trip-builder-title]:col-span-full [&>.trip-builder-title>span]:hidden [&>.trip-builder-title>strong]:inline-flex [&>.trip-builder-title>strong]:items-center [&>.trip-builder-title>strong]:gap-2.5 [&>.trip-builder-title>strong]:text-[30px] [&>.trip-builder-title>strong]:leading-[34px] [&>.trip-builder-title>strong]:text-[#111827] max-[767px]:[&>.trip-builder-title>strong]:text-[28px] max-[767px]:[&>.trip-builder-title>strong]:leading-8 [&>.trip-builder-title>small]:mt-2 [&>.trip-builder-title>small]:block [&>.trip-builder-title>small]:max-w-[420px] [&>.trip-builder-title>small]:text-[13px] [&>.trip-builder-title>small]:font-[650] [&>.trip-builder-title>small]:leading-[18px] [&>.trip-builder-title>small]:text-(--color-text-muted) max-[767px]:[&>.trip-builder-title>small]:max-w-[260px] max-[767px]:[&>.trip-builder-title>small]:text-[11px]";
const portalCreateTripInlineClassName =
  "portal-create-trip-inline portal-trip-simple !gap-4 !rounded-none !border-0 !bg-transparent !p-0 !shadow-none";
const tripSimpleHeadClassName = "trip-simple-head hidden";
const tripWizardLayoutClassName =
  "trip-wizard-layout grid grid-cols-[minmax(430px,0.76fr)_minmax(560px,1fr)] items-start gap-[22px] max-[1023px]:grid-cols-1";
const tripWizardMainClassName =
  "trip-wizard-main min-h-0 rounded-[10px] border border-[rgb(203_213_225_/_0.72)] bg-[rgb(255_255_255_/_0.92)] p-0 shadow-[0_10px_24px_rgb(15_23_42_/_0.04)] max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:bg-transparent max-[767px]:shadow-none";
const tripWizardPaneClassName =
  "trip-wizard-pane grid gap-0 [&_.account-two-col]:rounded-[18px] [&_.account-two-col]:border [&_.account-two-col]:border-(--color-border) [&_.account-two-col]:bg-white [&_.account-two-col]:p-3 max-[767px]:[&_.account-two-col]:p-2.5 [&>p]:m-0 [&>p]:text-[13px] [&>p]:leading-5 [&>p]:text-(--color-text-muted) [&_input]:min-h-[52px] [&_input]:rounded-[14px] [&_input]:text-[15px] [&_label]:min-h-[76px] [&_label_small]:mt-1.5 [&_label_small]:block [&_label_small]:text-[11px] [&_label_small]:leading-4 [&_label_small]:text-(--color-text-muted)";
const tripScopePanelClassName =
  "trip-scope-panel grid gap-0 rounded-[10px] border-0 bg-transparent px-[22px] pb-6 pt-7 max-[767px]:px-0 max-[767px]:pb-2 max-[767px]:pt-2";
const tripLivePreviewClassName =
  "trip-live-preview sticky top-[18px] z-10 grid h-fit max-h-[calc(100vh-36px)] min-h-0 min-w-0 content-start gap-0 self-start overflow-y-auto overscroll-contain rounded-[10px] border border-[rgb(203_213_225_/_0.72)] bg-white px-3.5 pb-3 pt-5 shadow-[0_10px_24px_rgb(15_23_42_/_0.04)] max-[1023px]:static max-[1023px]:max-h-none max-[767px]:mt-0 max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:bg-transparent max-[767px]:p-0 max-[767px]:shadow-none";
const tripWorkflowNavClassName =
  "trip-workflow-nav mb-3 grid gap-2 rounded-[10px] border border-(--color-border) bg-(--color-surface-subtle) p-2.5 min-[1024px]:hidden [&_ol]:m-0 [&_ol]:grid [&_ol]:grid-flow-col [&_ol]:auto-cols-[minmax(64px,1fr)] [&_ol]:gap-1.5 [&_ol]:overflow-x-auto [&_ol]:overscroll-x-contain [&_ol]:p-0 [&_ol]:[scrollbar-width:none] [&_ol::-webkit-scrollbar]:hidden [&_li]:list-none [&_button]:min-h-8 [&_button]:w-full [&_button]:rounded-[7px] [&_button]:border [&_button]:border-(--color-border) [&_button]:bg-white [&_button]:px-1.5 [&_button]:py-1.5 [&_button]:text-center [&_button]:text-[11px] [&_button]:font-black [&_button]:text-(--color-text-muted) [&_button[aria-current='step']]:border-[#fed7aa] [&_button[aria-current='step']]:bg-[#fff7ed] [&_button[aria-current='step']]:text-[#c2410c] [&_p]:m-0 [&_p]:text-xs [&_p]:font-[850] [&_p]:text-[#c2410c]";
const tripStepSectionClassName = "trip-step-section grid gap-3.5 pb-[34px] max-[767px]:pb-4";
const tripStepSectionCompactClassName = cn(tripStepSectionClassName, "trip-step-section--compact pb-3.5");
const tripMobileStepActionsClassName =
  "trip-mobile-step-actions hidden items-center justify-between gap-2 py-2 max-[767px]:flex [&_.button]:w-auto [&_.button]:min-w-[96px] [&_span]:text-xs [&_span]:font-black [&_span]:text-(--color-text-muted)";
const tripStepHeadingClassName =
  "trip-step-heading grid gap-1.5 [&_span]:text-[13px] [&_span]:leading-[18px] [&_span]:text-(--color-text-muted) [&_strong]:text-lg [&_strong]:leading-6 [&_strong]:text-[#111827]";
const tripNameFieldClassName =
  "trip-name-field relative min-h-[52px] [&_input]:min-h-[52px] [&_input]:rounded-[9px] [&_input]:bg-[rgb(255_255_255_/_0.9)] [&_input]:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.8)] [&_small]:absolute [&_small]:right-[13px] [&_small]:top-[17px] [&_small]:text-xs [&_small]:font-bold [&_small]:text-(--color-text-muted)";
const tripCountryPickerClassName =
  "trip-country-picker grid gap-3 [&>small]:text-[11px] [&>small]:font-[750] [&>small]:leading-4 [&>small]:text-(--color-text-muted)";
const tripCountrySearchClassName =
  "trip-country-search relative grid gap-2 [&_input]:min-h-[52px] [&_input]:rounded-[9px] [&_input]:bg-[rgb(255_255_255_/_0.9)] [&_input]:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.8)] [&_label]:min-h-0";
const tripCityEntryClassName =
  "trip-city-entry grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 rounded-[9px] border border-(--color-border) bg-(--color-surface-subtle) p-2.5 max-[767px]:grid-cols-1 [&_input]:min-h-[42px] [&_input]:rounded-[9px] [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-white [&_input]:px-3.5 [&_label]:grid [&_label]:gap-1 [&_span]:text-xs [&_span]:font-[850] [&_span]:text-(--color-text-muted)";
const tripFormDestinationRowClassName =
  "trip-form-destination-row grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 max-[767px]:grid-cols-1";
const tripPlaceThumbClassName =
  "trip-place-thumb block size-[42px] rounded-md bg-[linear-gradient(145deg,rgb(15_118_110_/_0.28),transparent_54%),linear-gradient(45deg,rgb(255_255_255_/_0.22)_25%,transparent_25%_50%,rgb(255_255_255_/_0.22)_50%_75%,transparent_75%),#dbeafe] bg-[length:auto,12px_12px,auto]";
const tripMiniDestinationClassName =
  "trip-mini-destination grid min-h-[70px] grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2 rounded-[9px] border border-(--color-border) bg-white p-2 [&_small]:flex [&_small]:min-w-0 [&_small]:flex-wrap [&_small]:gap-x-1 [&_small]:text-[11px] [&_small]:leading-[15px] [&_small]:text-[#64748b] [&_small_span]:min-w-0 [&_small_span]:overflow-hidden [&_small_span]:text-ellipsis [&_strong]:block [&_button]:grid [&_button]:size-6 [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[#475569]";
const tripMiniAddClassName =
  "trip-mini-add grid min-h-[70px] grid-cols-[20px_minmax(0,1fr)] items-center gap-2 rounded-[9px] border border-dashed border-(--color-border) bg-white p-2 text-xs font-extrabold text-(--color-text-muted)";
const tripSelectedCountriesClassName =
  "trip-selected-countries flex min-h-[44px] flex-wrap items-center gap-3 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle) p-3 text-[13px] font-bold text-(--color-text-muted)";
const tripCountrySuggestionsClassName =
  "trip-country-suggestions grid grid-cols-3 gap-3 max-[767px]:grid-cols-1 [&_button]:grid [&_button]:min-h-[68px] [&_button]:grid-cols-[42px_minmax(0,1fr)] [&_button]:content-center [&_button]:items-center [&_button]:gap-[3px] [&_button]:rounded-[9px] [&_button]:border [&_button]:border-(--color-border) [&_button]:bg-(--color-surface) [&_button]:px-2.5 [&_button]:py-[9px] [&_button]:text-left [&_button]:text-(--color-text) [&_button]:transition-[background,border-color,box-shadow] [&_button]:duration-[180ms] [&_button:hover]:border-(--color-primary) [&_button:hover]:bg-(--color-primary-soft) [&_button:hover]:shadow-[0_10px_18px_rgb(15_118_110_/_0.08)] [&_button:focus-visible]:border-(--color-primary) [&_button:focus-visible]:bg-(--color-primary-soft) [&_button:focus-visible]:shadow-[0_10px_18px_rgb(15_118_110_/_0.08)] [&_button::before]:block [&_button::before]:size-[42px] [&_button::before]:rounded-md [&_button::before]:bg-[linear-gradient(145deg,rgb(15_118_110_/_0.28),transparent_54%),linear-gradient(45deg,rgb(255_255_255_/_0.22)_25%,transparent_25%_50%,rgb(255_255_255_/_0.22)_50%_75%,transparent_75%),#dbeafe] [&_button::before]:bg-[length:auto,12px_12px,auto] [&_button::before]:content-[''] [&_span]:col-start-2 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-[11px] [&_span]:leading-[15px] [&_span]:text-(--color-text-muted) [&_strong]:col-start-2 [&_strong]:text-[13px] [&_strong]:leading-[18px]";
const tripRouteCalendarClassName =
  "trip-route-calendar grid gap-2.5 rounded-[10px] border border-(--color-border) bg-white p-3 max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:bg-transparent max-[767px]:p-0 [&>legend]:px-1 [&>legend]:text-[13px] [&>legend]:font-[850] [&>legend]:leading-5 [&>legend]:text-(--color-text) [&>strong]:text-[14px] [&>strong]:leading-5 [&>strong]:text-(--color-text)";
const tripCalendarSummaryClassName =
  "trip-calendar-summary grid grid-cols-2 gap-2 max-[767px]:grid-cols-1 [&_label]:grid [&_label]:min-h-0 [&_label]:gap-1 [&_input]:min-h-10 [&_input]:rounded-[8px] [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface-subtle) [&_input]:px-3 [&_input]:text-[13px] [&_input]:font-black [&_span]:text-[11px] [&_span]:font-[850] [&_span]:text-(--color-text-muted)";
const tripCalendarGridClassName =
  "trip-calendar-grid grid grid-cols-7 gap-1 [&_button]:min-h-9 [&_button]:rounded-[7px] [&_button]:border [&_button]:border-(--color-border) [&_button]:bg-(--color-surface) [&_button]:text-xs [&_button]:font-black [&_button]:text-(--color-text-muted) [&_button]:transition-[background,border-color,color,box-shadow] [&_button:hover]:border-(--color-primary) [&_button:hover]:bg-(--color-primary-soft) [&_button[data-date-state='today']]:border-[#f59e0b] [&_button[data-date-state='today']]:text-[#92400e] [&_button[data-date-state='in-range']]:border-(--color-route-border) [&_button[data-date-state='in-range']]:bg-(--color-route-soft) [&_button[data-date-state='in-range']]:text-[#1d4ed8] [&_button[data-date-state='start']]:border-(--color-primary) [&_button[data-date-state='start']]:bg-(--color-primary) [&_button[data-date-state='start']]:text-white [&_button[data-date-state='end']]:border-(--color-primary) [&_button[data-date-state='end']]:bg-(--color-primary) [&_button[data-date-state='end']]:text-white [&_button[aria-pressed='true']]:shadow-[0_6px_12px_rgb(15_118_110_/_0.14)]";
const tripCalendarFooterClassName =
  "trip-calendar-footer grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2 max-[767px]:grid-cols-1 [&_.button]:min-h-9 [&_.button]:rounded-[8px]";
const tripDateArrowClassName =
  "trip-date-arrow grid size-9 items-center justify-items-center rounded-[8px] border border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong) max-[767px]:w-full";
const tripCalendarHelperClassName =
  "trip-calendar-helper flex items-center gap-2 border-t border-(--color-border) pt-2 text-xs leading-[18px] text-(--color-text-muted) [&_.icon]:size-4 [&_.icon]:shrink-0 [&_.icon]:text-(--color-primary-strong)";
const tripAccessPanelClassName =
  "trip-access-panel grid gap-3 rounded-[18px] border border-(--color-border) bg-white p-3 max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:bg-transparent max-[767px]:p-0 [&_summary]:mb-0 [&_summary]:flex [&_summary]:min-h-[42px] [&_summary]:cursor-pointer [&_summary]:items-center [&_summary]:justify-between [&_summary]:gap-3 [&_summary]:text-[13px] [&_summary]:font-black [&_summary]:text-(--color-text) [&_summary_strong]:overflow-hidden [&_summary_strong]:text-ellipsis [&_summary_strong]:whitespace-nowrap [&_summary_strong]:text-xs [&_summary_strong]:font-[850] [&_summary_strong]:text-(--color-text-muted) open:[&_summary]:mb-2 open:[&_summary]:border-b open:[&_summary]:border-(--color-border) open:[&_summary]:pb-2.5";
const tripGeneratedAccessClassName =
  "trip-generated-access grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2.5 border-t border-(--color-border) pt-3 max-[767px]:grid-cols-1 [&_label]:min-w-0 [&_input]:bg-white [&_.button]:min-h-[42px] [&_.button]:w-auto [&_.button]:whitespace-nowrap [&_.button]:rounded-[8px]";
const tripAccessNoteClassName =
  "trip-access-note mt-3 flex items-center gap-2 border-t border-(--color-border) pt-3 text-xs font-[750] leading-[18px] text-(--color-text-muted) max-[767px]:hidden [&_.icon]:size-4 [&_.icon]:shrink-0 [&_.icon]:text-(--color-primary-strong)";
const tripTicketReviewClassName =
  "trip-ticket-review grid grid-cols-2 gap-2.5 [.account-page--portal-new-trip_&]:hidden max-[767px]:grid-cols-1 [&>div]:grid [&>div]:min-h-[76px] [&>div]:content-center [&>div]:gap-1 [&>div]:rounded-(--radius-md) [&>div]:border [&>div]:border-(--color-border) [&>div]:bg-(--color-surface) [&>div]:p-3 [&_span]:text-[11px] [&_span]:font-[850] [&_span]:uppercase [&_span]:text-(--color-text-muted) [&_strong]:min-w-0 [&_strong]:[overflow-wrap:anywhere]";
const tripShareStripClassName =
  "trip-share-strip grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[9px] border border-(--color-route-border) bg-[rgb(239_246_255_/_0.92)] py-2 pl-4 pr-2.5 text-[13px] font-extrabold text-[#0f6670] min-[1024px]:grid-cols-[minmax(0,1fr)_auto_auto] max-[1023px]:grid-cols-1 max-[1023px]:text-left max-[1023px]:[&_.button]:w-full [&_span]:inline-flex [&_span]:min-w-0 [&_span]:items-center [&_span]:gap-2 [&_strong]:[overflow-wrap:anywhere] [&_.icon]:size-6 [&_.button]:min-h-9 [&_.button]:rounded-[7px]";
const tripCreatedShareClassName =
  "trip-created-share grid gap-2.5 rounded-[12px] border border-(--color-success-border) bg-[linear-gradient(180deg,rgb(240_253_244_/_0.94),white)] p-3 text-[13px] font-bold text-(--color-text-muted) [&_strong]:text-(--color-text) [&_code]:rounded-[6px] [&_code]:bg-white [&_code]:px-2 [&_code]:py-1 [&_code]:text-xs [&_code]:font-black [&_code]:text-(--color-primary-strong) [&_div]:flex [&_div]:flex-wrap [&_div]:gap-2 [&_.button]:w-auto";
const tripCreatedShareLinkClassName =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 py-[7px] text-[13px] font-extrabold text-(--color-primary-strong) no-underline";
const tripWizardActionsClassName =
  "trip-wizard-actions sticky bottom-0 z-20 grid gap-2.5 border-t border-[rgb(226_232_240_/_0.82)] bg-[rgb(255_255_255_/_0.94)] px-[22px] pb-[22px] pt-3.5 shadow-[0_-12px_26px_rgb(15_23_42_/_0.06)] backdrop-blur min-[1024px]:grid-cols-[minmax(430px,0.76fr)_minmax(560px,1fr)] min-[1024px]:items-stretch max-[767px]:[.account-page--portal-new-trip_&]:w-full max-[767px]:[.account-page--portal-new-trip_&]:px-0 max-[767px]:pb-3 max-[767px]:pt-2.5 [&_.trip-wizard-action-buttons]:flex [&_.trip-wizard-action-buttons]:justify-between [&_.trip-wizard-action-buttons]:gap-2.5 max-[767px]:[&_.trip-wizard-action-buttons]:flex-col [&_.button]:w-auto max-[767px]:[&_.button]:w-full [&_.button--primary]:min-h-[58px] [&_.button--primary]:flex-1 [&_.button--primary]:justify-center [&_.button--primary]:rounded-[9px] [&_.button--primary]:bg-(--color-primary) [&_.button--primary]:text-base [&_.button--primary]:shadow-[0_12px_24px_rgb(15_118_110_/_0.18)] [&_.button--primary:disabled]:bg-(--color-surface-muted) [&_.button--primary:disabled]:text-(--color-text-subtle) [&_.button--primary:disabled]:shadow-none [&_.button--secondary]:hidden";
const tripWizardActionStatusClassName =
  "trip-wizard-action-status m-0 inline-flex min-h-8 items-center gap-2 px-0 text-[12px] font-[850] text-(--color-text-muted) min-[1024px]:col-start-1 [&_.icon]:size-4 [&_.icon]:text-(--color-primary-strong)";
const tripWizardActionSummaryClassName =
  "trip-wizard-action-summary hidden min-h-8 min-w-0 items-center gap-4 text-[12px] text-(--color-text-muted) min-[1024px]:col-start-2 min-[1024px]:row-span-2 min-[1024px]:row-start-1 min-[1024px]:grid min-[1024px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[14px] [&_strong]:text-(--color-text) [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap";
const tripWizardActionButtonsClassName = "trip-wizard-action-buttons";
const tripBoardingPassClassName =
  "trip-draft-summary mx-auto mb-3 grid w-[min(100%,760px)] gap-3";
const tripMainTicketClassName =
  "trip-main-ticket relative grid gap-4 rounded-[10px] border border-(--color-border) bg-white p-5 max-[767px]:[.account-page--portal-new-trip_&]:p-4 [&_.trip-preview-map]:min-h-[170px] [&_.trip-preview-map]:rounded-[9px] max-[767px]:[.account-page--portal-new-trip_&_.trip-preview-map]:min-h-[148px] [&>p]:m-0 [&>p]:flex [&>p]:items-center [&>p]:gap-2 [&>p]:text-[13px] [&>p]:text-[#64748b] [&>strong]:block [&>strong]:[overflow-wrap:anywhere] [&>strong]:text-[24px] [&>strong]:leading-8 [&>strong]:text-[#090f1f] max-[767px]:[.account-page--portal-new-trip_&>strong]:text-2xl max-[767px]:[.account-page--portal-new-trip_&>strong]:leading-[29px]";
const tripPreviewMapClassName =
  "trip-preview-map relative min-h-[168px] overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--color-route-border)_82%,white)] bg-[linear-gradient(90deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),radial-gradient(circle_at_24%_32%,rgb(20_184_166_/_0.2),transparent_25%),radial-gradient(circle_at_76%_62%,rgb(56_189_248_/_0.22),transparent_28%),linear-gradient(160deg,rgb(236_253_245_/_0.96),rgb(239_246_255_/_0.94))] [background-size:34px_34px,34px_34px,auto,auto,auto] max-[767px]:min-h-[138px]";
const tripPreviewMapLiveClassName = "trip-preview-map--live isolate";
const tripPreviewMapReadyClassName = "trip-preview-map--ready bg-[#eef8ff]";
const tripPreviewMapCanvasClassName = "trip-preview-map-canvas absolute inset-0 z-[1]";
const tripPreviewMapFallbackClassName = "trip-preview-map-fallback absolute inset-0 z-[2]";
const tripCountrySvgFallbackClassName =
  "trip-country-svg-fallback absolute inset-3 z-[2] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-[rgb(37_99_235_/_0.14)] bg-[linear-gradient(135deg,rgb(255_255_255_/_0.76),rgb(239_246_255_/_0.58))] px-3 [&_svg]:h-[112px] [&_svg]:w-full [&_svg]:min-w-0 [&_path]:fill-[rgb(15_118_110_/_0.24)] [&_path]:stroke-[rgb(15_118_110_/_0.7)] [&_path]:stroke-[1.2px] [&_strong]:grid [&_strong]:size-11 [&_strong]:place-items-center [&_strong]:rounded-[8px] [&_strong]:bg-white [&_strong]:text-sm [&_strong]:font-black [&_strong]:text-[#1d4ed8] [&_strong]:shadow-[0_10px_20px_rgb(15_23_42_/_0.08)]";
const tripPreviewMapSourceClassName =
  "trip-preview-map-source absolute left-2.5 top-2.5 z-[4] inline-flex min-h-7 max-w-[calc(100%_-_20px)] items-center gap-1.5 rounded-full border border-[rgb(15_118_110_/_0.22)] bg-[rgb(255_255_255_/_0.9)] px-[9px] text-[11px] font-black text-(--color-primary-strong) shadow-[0_10px_18px_rgb(15_23_42_/_0.12)] [&_.icon]:size-[13px]";
const tripPreviewLiveMarkerClassName =
  "trip-preview-live-marker grid size-7 place-items-center rounded-full border-2 border-white bg-(--color-primary) text-xs font-black text-white shadow-[0_10px_20px_rgb(15_23_42_/_0.22)]";
const tripPreviewRouteLineClassName =
  "trip-preview-route-line absolute left-[28%] top-[52%] w-[44%] -rotate-[13deg] border-t-2 border-dashed border-[rgb(15_118_110_/_0.58)]";
const tripPreviewPinClassName =
  "trip-preview-pin absolute z-[1] grid size-[38px] place-items-center rounded-full border border-(--color-primary-border) bg-[rgb(255_255_255_/_0.94)] text-(--color-primary-strong) shadow-[0_12px_24px_rgb(15_23_42_/_0.12)] [&_.icon]:size-[18px]";
const tripPreviewPinOriginClassName = "trip-preview-pin--origin left-[18%] top-[54%]";
const tripPreviewPinDestinationClassName = "trip-preview-pin--destination right-[18%] top-[32%] border-(--color-route-border) text-(--color-route)";
const tripPreviewTicketTopClassName =
  "trip-boarding-ticket-top flex items-center justify-between gap-2.5 [&>span]:text-xs [&>span]:font-black [&>span]:tracking-[0.02em] [&>span]:text-[#64748b]";
const tripFlightRouteClassName =
  "trip-flight-route mb-[18px] grid grid-cols-[86px_minmax(0,1fr)_86px] items-center gap-2.5 max-[767px]:[.account-page--portal-new-trip_&]:grid-cols-[58px_minmax(0,1fr)_58px] [&_div]:grid [&_div]:gap-0.5 [&_div:last-child]:text-right [&_span]:text-xs [&_span]:text-[#64748b] [&_strong]:text-[21px] [&_strong]:leading-6 [&_strong]:text-[#111827]";
const tripFlightLineClassName =
  "trip-flight-line relative grid h-px place-items-center border-t-2 border-dashed border-[rgb(100_116_139_/_0.42)] before:absolute before:left-0 before:top-[-5px] before:size-2.5 before:rounded-full before:bg-[#3f7194] before:content-[''] after:absolute after:right-0 after:top-[-5px] after:size-2.5 after:rounded-full after:bg-[#3f7194] after:content-[''] [&_.icon]:size-7 [&_.icon]:bg-white [&_.icon]:p-1 [&_.icon]:text-[#3f7194]";
const tripPreviewDestinationRowClassName =
  "trip-preview-destination-row grid gap-2.5 [&>span]:text-xs [&>span]:font-black [&>span]:uppercase [&>span]:text-[#64748b] [&>div]:grid [&>div]:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] [&>div]:gap-2.5 max-[767px]:[.account-page--portal-new-trip_&>div]:grid-cols-1";
const tripPreviewDestinationCardClassName =
  "trip-preview-destination-card grid min-h-[82px] gap-1.5 rounded-[9px] border border-(--color-border) bg-(--color-surface-subtle) p-3 text-left [&_small]:flex [&_small]:min-w-0 [&_small]:flex-wrap [&_small]:gap-x-1 [&_small]:text-[11px] [&_small]:leading-4 [&_small]:text-[#64748b] [&_strong]:min-w-0 [&_strong]:[overflow-wrap:anywhere] [&_strong]:text-[15px] [&_strong]:leading-5 [&_strong]:text-[#111827]";
const tripTicketStubClassName =
  "trip-ticket-stub grid grid-cols-3 gap-2.5 rounded-[10px] border border-(--color-border) bg-(--color-surface-subtle) p-3 max-[767px]:[.account-page--portal-new-trip_&]:grid-cols-1 [&>div]:grid [&>div]:gap-1 [&>div]:rounded-[8px] [&>div]:border [&>div]:border-(--color-border) [&>div]:bg-white [&>div]:p-3 [&>div_span]:text-xs [&>div_span]:text-[#64748b] [&>div_strong]:min-w-0 [&>div_strong]:[overflow-wrap:anywhere] [&>div_strong]:text-[15px] [&>div_strong]:leading-5 [&>div_strong]:text-[#111827] [&>.icon]:hidden";
const portalFeatureCardClassName = cn(accountCardClassName, "portal-feature-card col-span-2 max-[767px]:col-auto");
const portalSettingsCardClassName = cn(accountCardClassName, "account-settings-card col-span-2 max-[767px]:col-auto");
const accountPanelHeadingClassName =
  "account-panel-heading flex min-w-0 items-center gap-3 max-[767px]:flex-wrap max-[767px]:items-start [&>div]:max-[767px]:min-w-0 [&_small]:text-[13px] [&_small]:leading-5 [&_small]:text-(--color-text-muted) max-[767px]:[&_small]:[overflow-wrap:anywhere] [&_span[aria-hidden=true]]:grid [&_span[aria-hidden=true]]:size-9 [&_span[aria-hidden=true]]:shrink-0 [&_span[aria-hidden=true]]:place-items-center [&_span[aria-hidden=true]]:rounded-(--radius-md) [&_span[aria-hidden=true]]:bg-(--color-primary-soft) [&_span[aria-hidden=true]]:text-(--color-primary-strong) [&_strong]:block [&_strong]:text-(--color-text)";
const accountStatGridClassName = "account-stat-grid grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1";
const accountSettingsGridClassName = "account-settings-grid grid grid-cols-2 gap-2.5";
const accountSettingLineClassName =
  "account-setting-line grid min-h-[66px] content-center gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-(--color-text-muted) [&_strong]:text-sm [&_strong]:text-(--color-text)";
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
const portalEmptyStateClassName =
  "portal-empty-state grid min-h-[164px] content-center gap-3 rounded-(--radius-lg) border border-dashed border-(--color-border-strong) bg-[color-mix(in_srgb,var(--color-surface-subtle)_72%,var(--color-surface))] p-4 text-left [&_.button]:w-fit max-[767px]:[&_.button]:w-full [&>span[aria-hidden=true]]:grid [&>span[aria-hidden=true]]:size-10 [&>span[aria-hidden=true]]:place-items-center [&>span[aria-hidden=true]]:rounded-(--radius-md) [&>span[aria-hidden=true]]:bg-(--color-primary-soft) [&>span[aria-hidden=true]]:text-(--color-primary-strong) [&_p]:m-0 [&_p]:max-w-[560px] [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-base [&_strong]:leading-6 [&_strong]:text-(--color-text)";
const cloudProviderPanelClassName = "cloud-provider-panel grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
const cloudProviderGridClassName = "cloud-provider-grid grid grid-cols-4 gap-2 max-[767px]:grid-cols-2";
const cloudProviderButtonClassName = "cloud-provider-button inline-flex min-h-[46px] items-center justify-center gap-2 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) text-xs font-[850] text-(--color-text) transition-[border-color,background,color] duration-[180ms] hover:border-(--color-primary) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) focus-visible:border-(--color-primary) focus-visible:bg-(--color-primary-soft) focus-visible:text-(--color-primary-strong) disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:hover:border-(--color-border) disabled:hover:bg-(--color-surface-muted) disabled:hover:text-(--color-text-muted)";
const settingsProfilePreviewClassName = "settings-profile-preview grid grid-cols-[46px_minmax(0,1fr)] items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
const portalSearchClassName =
  "portal-search grid min-h-[46px] grid-cols-[20px_minmax(0,1fr)] items-center gap-2.5 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3 text-(--color-text-muted) [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:font-[inherit] [&_input]:font-[750] [&_input]:text-(--color-text) [&_input]:outline-0";
const portalMapPreviewClassName =
  "portal-map-preview relative min-h-[220px] overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-[linear-gradient(90deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),linear-gradient(0deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),radial-gradient(circle_at_24%_30%,rgb(20_184_166_/_0.18),transparent_24%),radial-gradient(circle_at_76%_68%,rgb(59_130_246_/_0.16),transparent_26%),var(--color-surface-subtle)] bg-[length:34px_34px,34px_34px,auto,auto,auto] max-[767px]:min-h-[180px]";
const portalMapPinClassName =
  "portal-map-pin absolute left-[var(--pin-x)] top-[var(--pin-y)] z-[1] grid size-[34px] place-items-center rounded-full border border-(--color-primary-border) bg-(--color-surface) text-(--color-primary-strong) shadow-[var(--shadow-soft)]";
const accountDeviceListClassName = "account-device-list grid gap-2";
const accountDeviceRowClassName =
  "account-device-row flex min-w-0 items-center justify-between gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 max-[767px]:flex-wrap max-[767px]:items-start [&>.button]:w-auto [&>.button]:min-w-[124px] [&>.button]:shrink-0 max-[767px]:[&>.button]:w-full [&>div]:max-[767px]:min-w-0 [&_span]:block [&_span]:text-xs [&_span]:leading-[18px] [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block";
const accountFormClassName =
  "account-form [&_input]:min-h-[46px] [&_input]:w-full [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-(--color-text) [&_input]:transition-[border-color,box-shadow,background] [&_input]:duration-[180ms] [&_input]:ease-out [&_input:focus]:border-(--color-primary) [&_input:focus]:shadow-[0_0_0_4px_rgb(15_118_110_/_0.12)] [&_input:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted) [&_select]:min-h-[46px] [&_select]:w-full [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border-strong) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-(--color-text) [&_select]:transition-[border-color,box-shadow,background] [&_select]:duration-[180ms] [&_select]:ease-out [&_select:focus]:border-(--color-primary) [&_select:focus]:shadow-[0_0_0_4px_rgb(15_118_110_/_0.12)] [&_select:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))]";
const accountCheckClassName =
  "account-check grid grid-cols-[auto_minmax(0,1fr)] items-center [&_input]:min-h-[18px] [&_input]:w-[18px]";
const accountFieldClassName = "account-field grid gap-1.5";
const accountFieldHintClassName = "account-field-hint m-0 text-xs font-[650] leading-[18px] text-(--color-text-muted)";
const accountTwoColClassName =
  "account-two-col grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted)";
const accountSettingsFormClassName = cn(accountFormClassName, "account-settings-form grid gap-3");
const accountLoginFlowClassName = "account-login-flow grid w-[min(100%,560px)] justify-self-center gap-3";
const accountEntryLoginFlowClassName =
  "relative col-start-2 row-start-3 w-[min(100%,520px)] self-start justify-self-center gap-[22px] rounded-[14px] border border-(--color-border) bg-[rgb(255_255_255_/_0.96)] p-[clamp(24px,3vw,34px)] pt-[70px] shadow-[0_24px_54px_rgb(15_23_42_/_0.1)] max-[767px]:col-start-1 max-[767px]:row-start-1 max-[767px]:mt-[76px] max-[767px]:w-[min(100%,460px)]";
const accountAuthCardClassName = cn(
  accountCardClassName,
  "account-auth-card !gap-4 !overflow-visible !border-0 !bg-transparent !p-0 !shadow-none",
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
const accountAlternateActionsClassName = "account-alternate-actions flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[13px] font-[800]";
const accountTertiaryActionClassName =
  "account-tertiary-action inline-flex min-h-8 items-center justify-center gap-1.5 rounded-(--radius-sm) border-0 bg-transparent p-0 text-[13px] font-[850] text-(--color-primary-strong) underline-offset-4 transition-colors duration-150 hover:enabled:underline focus-visible:underline disabled:cursor-not-allowed disabled:text-(--color-text-subtle) [&_.icon]:size-4";

interface TripCountryOption {
  code: string;
  name: string;
  continent: Exclude<TripContinent, "all">;
  currency: string;
  cities: string[];
  x: number;
  y: number;
}

const ACCESS_ERROR_CODES = {
  accountLoadFailed: "account-load-failed",
  passkeyRegistrationCredential: "passkey-registration-credential",
  passkeyLoginCredential: "passkey-login-credential",
  passkeyUnsupported: "passkey-unsupported",
} as const;

const defaultTripForm = (ownerDisplayName = "", profile?: AccountSettings["profile"] | null): AccountTripCreateRequest => {
  const origin = originCityFromProfile(profile);
  return {
    name: "",
    originLabel: `${origin.city}, ${origin.country}`,
    originCity: origin.city,
    originCountry: origin.country,
    originCountryCode: origin.countryCode,
    destinationLabel: "",
    destinationCities: [],
    countries: [],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    ownerDisplayName,
    joinId: generateJoinId(),
    joinPassword: generateJoinPassword(),
  };
};

const tripCountryOptions: TripCountryOption[] = [
  { code: "JP", name: "Japan", continent: "asia", currency: "JPY", cities: ["Tokyo", "Osaka", "Kyoto", "Sapporo"], x: 78, y: 42 },
  { code: "KR", name: "South Korea", continent: "asia", currency: "KRW", cities: ["Seoul", "Busan", "Jeju"], x: 74, y: 41 },
  { code: "TH", name: "Thailand", continent: "asia", currency: "THB", cities: ["Bangkok", "Chiang Mai", "Phuket"], x: 68, y: 54 },
  { code: "SG", name: "Singapore", continent: "asia", currency: "SGD", cities: ["Singapore"], x: 69, y: 61 },
  { code: "CN", name: "China", continent: "asia", currency: "CNY", cities: ["Beijing", "Shanghai", "Shenzhen"], x: 71, y: 44 },
  { code: "HK", name: "Hong Kong", continent: "asia", currency: "HKD", cities: ["Hong Kong"], x: 72, y: 51 },
  { code: "TW", name: "Taiwan", continent: "asia", currency: "TWD", cities: ["Taipei", "Kaohsiung"], x: 75, y: 51 },
  { code: "VN", name: "Vietnam", continent: "asia", currency: "VND", cities: ["Hanoi", "Da Nang", "Ho Chi Minh City"], x: 70, y: 55 },
  { code: "FR", name: "France", continent: "europe", currency: "EUR", cities: ["Paris", "Nice", "Lyon"], x: 48, y: 38 },
  { code: "IT", name: "Italy", continent: "europe", currency: "EUR", cities: ["Rome", "Milan", "Venice"], x: 51, y: 42 },
  { code: "ES", name: "Spain", continent: "europe", currency: "EUR", cities: ["Madrid", "Barcelona", "Seville"], x: 45, y: 43 },
  { code: "GB", name: "United Kingdom", continent: "europe", currency: "GBP", cities: ["London", "Edinburgh", "Manchester"], x: 46, y: 34 },
  { code: "DE", name: "Germany", continent: "europe", currency: "EUR", cities: ["Berlin", "Munich", "Frankfurt"], x: 51, y: 36 },
  { code: "CH", name: "Switzerland", continent: "europe", currency: "CHF", cities: ["Zurich", "Lucerne", "Geneva"], x: 50, y: 40 },
  { code: "US", name: "United States", continent: "north-america", currency: "USD", cities: ["New York", "Los Angeles", "San Francisco"], x: 20, y: 41 },
  { code: "CA", name: "Canada", continent: "north-america", currency: "CAD", cities: ["Vancouver", "Toronto", "Montreal"], x: 19, y: 30 },
  { code: "MX", name: "Mexico", continent: "north-america", currency: "MXN", cities: ["Mexico City", "Cancun", "Oaxaca"], x: 19, y: 52 },
  { code: "BR", name: "Brazil", continent: "south-america", currency: "BRL", cities: ["Rio de Janeiro", "Sao Paulo", "Salvador"], x: 34, y: 70 },
  { code: "PE", name: "Peru", continent: "south-america", currency: "PEN", cities: ["Lima", "Cusco"], x: 27, y: 69 },
  { code: "AU", name: "Australia", continent: "oceania", currency: "AUD", cities: ["Sydney", "Melbourne", "Perth"], x: 80, y: 76 },
  { code: "NZ", name: "New Zealand", continent: "oceania", currency: "NZD", cities: ["Auckland", "Queenstown", "Wellington"], x: 88, y: 82 },
  { code: "MA", name: "Morocco", continent: "africa", currency: "MAD", cities: ["Marrakech", "Casablanca", "Fes"], x: 45, y: 51 },
  { code: "EG", name: "Egypt", continent: "africa", currency: "EGP", cities: ["Cairo", "Luxor", "Alexandria"], x: 56, y: 52 },
  { code: "ZA", name: "South Africa", continent: "africa", currency: "ZAR", cities: ["Cape Town", "Johannesburg"], x: 55, y: 80 },
];

type TripCityOption = TripCity & { airportCode: string; capital?: boolean };

const tripCityOptions: TripCityOption[] = [
  { city: "Bangkok", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 13.7563, longitude: 100.5018, airportCode: "BKK", capital: true },
  { city: "Chiang Mai", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 18.7883, longitude: 98.9853, airportCode: "CNX" },
  { city: "Phuket", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 7.8804, longitude: 98.3923, airportCode: "HKT" },
  { city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503, airportCode: "TYO", capital: true },
  { city: "Osaka", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 34.6937, longitude: 135.5023, airportCode: "OSA" },
  { city: "Kyoto", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.0116, longitude: 135.7681, airportCode: "UKY" },
  { city: "Sapporo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 43.0618, longitude: 141.3545, airportCode: "CTS" },
  { city: "Seoul", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 37.5665, longitude: 126.978, airportCode: "SEL", capital: true },
  { city: "Busan", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 35.1796, longitude: 129.0756, airportCode: "PUS" },
  { city: "Jeju", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 33.4996, longitude: 126.5312, airportCode: "CJU" },
  { city: "Hong Kong", country: "Hong Kong", countryCode: "HK", timezone: "Asia/Hong_Kong", latitude: 22.3193, longitude: 114.1694, airportCode: "HKG", capital: true },
  { city: "Shenzhen", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 22.5431, longitude: 114.0579, airportCode: "SZX" },
  { city: "Shanghai", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 31.2304, longitude: 121.4737, airportCode: "SHA" },
  { city: "Beijing", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 39.9042, longitude: 116.4074, airportCode: "BJS", capital: true },
  { city: "Singapore", country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore", latitude: 1.3521, longitude: 103.8198, airportCode: "SIN", capital: true },
  { city: "Taipei", country: "Taiwan", countryCode: "TW", timezone: "Asia/Taipei", latitude: 25.033, longitude: 121.5654, airportCode: "TPE", capital: true },
  { city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 48.8566, longitude: 2.3522, airportCode: "PAR", capital: true },
  { city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.5072, longitude: -0.1276, airportCode: "LON", capital: true },
  { city: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 40.7128, longitude: -74.006, airportCode: "NYC" },
  { city: "Los Angeles", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 34.0522, longitude: -118.2437, airportCode: "LAX" },
  { city: "San Francisco", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 37.7749, longitude: -122.4194, airportCode: "SFO" },
];

const portalSectionOrder: PortalSection[] = ["dashboard", "trips", "new-trip", "explorer", "todos", "vault", "settings", "sign-out"];
const portalSectionStorageKey = "sagittarius:portal-section-index";

interface AccountPortalDataCache {
  explorer: AccountExplorerSummary | null;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}

interface CreatedTripShare {
  inviteLink: string;
  joinId: string;
  name: string;
}

type TripWizardStepId = "trip" | "place" | "dates" | "invite" | "preview";

const tripWizardSteps: Array<{ id: TripWizardStepId; label: string; regionLabel: string; nextCopy: string }> = [
  { id: "trip", label: "Trip", regionLabel: "Trip details step", nextCopy: "Next: add destination detail" },
  { id: "place", label: "Place", regionLabel: "Destination step", nextCopy: "Next: choose route dates" },
  { id: "dates", label: "Dates", regionLabel: "Dates step", nextCopy: "Next: check invite access" },
  { id: "invite", label: "Invite", regionLabel: "Invite step", nextCopy: "Next: preview trip" },
  { id: "preview", label: "Preview", regionLabel: "Preview step", nextCopy: "Review before create" },
];

let accountPortalDataCache: (AccountPortalDataCache & { sessionToken: string }) | null = null;

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

function AuthTravelCollage({ labels }: { labels: Messages["access"]["entryHero"] }) {
  const photos = [
    { id: "krabi", label: "Krabi, Thailand", alt: "Krabi beach lagoon with limestone cliffs and a longtail boat" },
    { id: "cappadocia", label: "Cappadocia, Turkiye", alt: "Cappadocia sunrise landscape with hot air balloons" },
    { id: "kyoto", label: "Kyoto, Japan", alt: "Kyoto traditional street with wooden houses and a pagoda" },
    { id: "santorini", label: "Santorini, Greece", alt: "Santorini coast with blue domes and the Aegean sea" },
  ];

  return (
    <div className="account-travel-collage" aria-label={labels.collageLabel}>
      {photos.map((photo, index) => (
        <figure className={cn(travelPhotoCardClassName, travelPhotoCardVariants[photo.id])} key={photo.id}>
          <Image alt={photo.alt} className={travelPhotoImageClassName} fill loading={index === 0 ? "eager" : "lazy"} sizes="220px" src={`/landing/auth/photo-${photo.id}.png`} />
          <span className={travelPhotoHeartClassName} aria-hidden="true" />
          <figcaption className={travelPhotoCaptionClassName}>{photo.label}</figcaption>
        </figure>
      ))}
      <span className={travelNextCardClassName}>
        <Icon name="location" />
        <span>
          <small>{labels.nextLabel}</small>
          <strong>{labels.nextTrip}</strong>
          <small>{labels.nextDate}</small>
        </span>
      </span>
    </div>
  );
}

function AuthHighlights({
  entryHero,
  flow,
  highlights,
}: {
  entryHero?: Messages["access"]["entryHero"];
  flow: "login" | "register";
  highlights: Messages["access"]["highlights"];
}) {
  const items = flow === "register"
    ? [highlights.registerSecure, highlights.registerHistory, highlights.registerOwner]
    : [highlights.secure, highlights.history, highlights.trusted];
  const entryItems = entryHero
    ? [
        { title: entryHero.safeTitle, detail: entryHero.safeDetail },
        { title: entryHero.syncTitle, detail: entryHero.syncDetail },
        { title: entryHero.exploreTitle, detail: entryHero.exploreDetail },
      ]
    : null;

  return (
    <ul className={accountAuthHighlightsClassName} aria-label={highlights.label}>
      <li className={accountAuthHighlightClassName}>
        <Icon name="check" />
        <span>{entryItems ? <><strong>{entryItems[0].title}</strong><small>{entryItems[0].detail}</small></> : items[0]}</span>
      </li>
      <li className={accountAuthHighlightClassName}>
        <Icon name="clock" />
        <span>{entryItems ? <><strong>{entryItems[1].title}</strong><small>{entryItems[1].detail}</small></> : items[1]}</span>
      </li>
      <li className={accountAuthHighlightClassName}>
        <Icon name="key" />
        <span>{entryItems ? <><strong>{entryItems[2].title}</strong><small>{entryItems[2].detail}</small></> : items[2]}</span>
      </li>
    </ul>
  );
}

function AccountPortalLoadingFrame({ portalSection }: { portalSection: PortalSection }) {
  const { t } = useI18n();
  const portalNavItems = getPortalNavItems(t);
  const cachedEmail = accountPortalDataCache?.settings?.profile.primaryEmail ?? t.access.dashboard.noEmail;

  return (
    <div className={accountDashboardClassName} id="account-portal" aria-busy="true">
      <nav className={portalNavClassName} aria-label={t.access.portal.nav.label}>
        <div className={portalNavBrandClassName}>
          <div>
            <strong>{t.access.portal.title}</strong>
            <span>{cachedEmail}</span>
          </div>
        </div>
        <div className={portalNavLinksClassName}>
          {portalNavItems.map((item) => (
            <Link href={item.href} key={item.href} className={cn(portalNavLinkClassName, item.id === portalSection ? portalNavLinkActiveClassName : "")} aria-current={item.id === portalSection ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href={appRoutes.portalSignOut()}
            className={cn(portalNavLinkClassName, portalSection === "sign-out" ? portalNavLinkActiveClassName : "")}
            aria-current={portalSection === "sign-out" ? "page" : undefined}
          >
            <Icon name="x" />
            <span>{t.access.dashboard.logout}</span>
          </Link>
        </div>
      </nav>
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

function mainLabel(accessMode: AccountAccessPanelProps["accessMode"], labels: Messages["access"]["mainLabels"]): string {
  if (accessMode === "account-login") return labels.accountLogin;
  if (accessMode === "account-register") return labels.accountRegister;
  if (accessMode === "account-portal") return labels.accountPortal;
  if (accessMode === "trip-access") return labels.tripAccess;
  return labels.combined;
}

function getPortalNavItems(t: Messages) {
  return [
    { id: "dashboard" as const, href: appRoutes.portal(), icon: "home" as const, label: t.access.portal.nav.dashboard },
    { id: "trips" as const, href: appRoutes.portalMyTrips(), icon: "calendar" as const, label: t.access.portal.nav.trips },
    { id: "explorer" as const, href: appRoutes.portalExplorer(), icon: "map" as const, label: t.access.portal.nav.explorer },
    { id: "todos" as const, href: appRoutes.portalToDos(), icon: "list" as const, label: t.access.portal.nav.todos },
    { id: "vault" as const, href: appRoutes.portalVault(), icon: "document" as const, label: t.access.portal.nav.vault },
    { id: "settings" as const, href: appRoutes.portalSettings(), icon: "settings" as const, label: t.access.portal.nav.settings },
  ];
}

function getAccountPortalDataCache(sessionToken: string): AccountPortalDataCache | null {
  if (accountPortalDataCache?.sessionToken !== sessionToken) return null;
  return accountPortalDataCache;
}

function cacheAccountPortalData(sessionToken: string, data: AccountPortalDataCache) {
  accountPortalDataCache = { ...data, sessionToken };
}

function clearAccountPortalDataCache(sessionToken: string) {
  if (accountPortalDataCache?.sessionToken === sessionToken) accountPortalDataCache = null;
}

function heroTitle(accessMode: AccountAccessPanelProps["accessMode"], titles: Messages["access"]["titles"]): string {
  if (accessMode === "account-login") return titles.accountLogin;
  if (accessMode === "account-register") return titles.accountRegister;
  if (accessMode === "account-portal") return titles.accountPortal;
  if (accessMode === "trip-access") return titles.tripAccess;
  return titles.combined;
}

function heroDetail(accessMode: AccountAccessPanelProps["accessMode"], details: Messages["access"]["details"]): string {
  if (accessMode === "account-login") return details.accountLogin;
  if (accessMode === "account-register") return details.accountRegister;
  if (accessMode === "account-portal") return details.accountPortal;
  if (accessMode === "trip-access") return details.tripAccess;
  return details.combined;
}

function isAccountEntryMode(accessMode: AccountAccessPanelProps["accessMode"]): accessMode is "account-login" | "account-register" {
  return accessMode === "account-login" || accessMode === "account-register";
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
        avatarColor: "#0f766e",
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
      onError(errorMessage(caught, activeFlow === "register" ? t.access.emailLogin.errors.passwordRegisterFailed : t.access.emailLogin.errors.passwordLoginFailed, t.access.messages));
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

  const portalNavItems = getPortalNavItems(t);
  const activePortalSection = portalSection === "new-trip" ? "trips" : portalSection;
  const currentPortalSectionIndex = portalSectionOrder.indexOf(portalSection);

  useEffect(() => {
    window.sessionStorage.setItem(portalSectionStorageKey, String(currentPortalSectionIndex));
  }, [currentPortalSectionIndex]);

  return (
    <div className={accountDashboardClassName} id="account-portal" data-transition-direction={transitionDirection}>
      <nav className={portalNavClassName} aria-label={t.access.portal.nav.label}>
        <div className={portalNavBrandClassName}>
          <div>
            <strong>{t.access.portal.title}</strong>
            <span>{settings?.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
          </div>
        </div>
        <div className={portalNavLinksClassName}>
          {portalNavItems.map((item) => (
            <Link href={item.href} key={item.href} className={cn(portalNavLinkClassName, item.id === activePortalSection ? portalNavLinkActiveClassName : "")} aria-current={item.id === activePortalSection ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href={appRoutes.portalSignOut()}
            className={cn(portalNavLinkClassName, activePortalSection === "sign-out" ? portalNavLinkActiveClassName : "")}
            aria-current={activePortalSection === "sign-out" ? "page" : undefined}
          >
            <Icon name="x" />
            <span>{t.access.dashboard.logout}</span>
          </Link>
        </div>
      </nav>

      <div className={portalContentClassName}>
        {portalSection === "dashboard" ? <section className={portalProfileCardClassName} id="portal-dashboard">
          <PanelHeading icon="home" title={t.access.portal.sections.dashboard.title} detail={t.access.portal.sections.dashboard.detail} />
          <div className={accountProfileRowClassName}>
            <span className={accountAvatarClassName} style={{ backgroundColor: settings?.profile.avatarColor ?? "#0f766e" }} aria-hidden="true">
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
                <select value={vaultForm.kind} onChange={(event) => setVaultForm((current) => ({ ...current, kind: event.target.value as "note" | "file" }))}>
                  <option value="note">{t.access.portal.vaultCreate.note}</option>
                  <option value="file">{t.access.portal.vaultCreate.file}</option>
                </select>
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

function PortalTripWizard({
  defaultOwnerDisplayName,
  isSubmitting,
  onChange,
  onSubmit,
  tripForm,
}: {
  defaultOwnerDisplayName: string;
  isSubmitting: boolean;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  onSubmit: (form?: AccountTripCreateRequest) => void;
  tripForm: AccountTripCreateRequest;
}) {
  const { locale, t } = useI18n();
  const wizard = t.access.dashboard.createTrip.wizard;
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [hasEditedOwnerDisplayName, setHasEditedOwnerDisplayName] = useState(false);
  const [hasCopiedJoinCode, setHasCopiedJoinCode] = useState(false);
  const [selectingDateStep, setSelectingDateStep] = useState<"depart" | "return">("depart");
  const [accessSalt, setAccessSalt] = useState(() => randomToken(3));
  const [activeMobileStep, setActiveMobileStep] = useState<TripWizardStepId>("trip");
  const destinationSearchRef = useRef<HTMLInputElement | null>(null);
  const mobileStepButtonRefs = useRef<Map<TripWizardStepId, HTMLButtonElement>>(new Map());
  const ownerDisplayName = tripForm.ownerDisplayName;
  const effectiveOwnerDisplayName = hasEditedOwnerDisplayName ? ownerDisplayName : ownerDisplayName || defaultOwnerDisplayName;
  const selectedDestinationCities = tripForm.destinationCities;
  const selectedCountryNames = uniqueList(selectedDestinationCities.map((city) => city.country));
  const selectedCityNames = selectedDestinationCities.map((city) => city.city);
  const selectedDestinationNames = selectedCityNames;
  const selectedDestinationKey = selectedDestinationNames.join("|");
  const destinationComplete = selectedDestinationCities.length > 0;
  const datesComplete = Boolean(tripForm.startDate && tripForm.endDate);
  const generatedJoinId = generateJoinIdForTrip(tripForm.startDate, selectedDestinationNames, accessSalt);
  const generatedJoinPassword = tripForm.joinPassword.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/) ? tripForm.joinPassword : generateJoinPassword();
  const accessComplete = Boolean(effectiveOwnerDisplayName.trim() && generatedJoinId.trim() && generatedJoinPassword.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/));
  const canSubmit = Boolean(tripForm.name.trim()) && destinationComplete && datesComplete && accessComplete;
  const suggestedCities = citySuggestions(cityQuery || countryQuery, selectedDestinationCities);
  const destinationSummary = selectedDestinationNames.length ? selectedDestinationNames.join(", ") : wizard.empty.destinationSummary;
  const currencySummary = selectedCountryNames.length ? uniqueList(selectedCountryNames.map((countryName) => tripCountryOptions.find((country) => country.name === countryName)?.currency ?? "").filter(Boolean)).join(", ") || wizard.empty.currencyByCity : wizard.empty.currency;
  const previewTripName = tripForm.name.trim() || wizard.empty.untitledTrip;
  const inviteStatus = accessComplete ? wizard.preview.inviteReady : wizard.preview.inviteDraft;
  const destinationCards = tripDestinationCards(selectedCountryNames, selectedCityNames, locale);
  const previewStartDate = formatPreviewTravelDate(tripForm.startDate);
  const previewEndDate = formatPreviewTravelDate(tripForm.endDate);
  const previewNightCount = tripNightCount(tripForm.startDate, tripForm.endDate, locale);
  const routeDestinationCode = destinationRouteCode(selectedDestinationNames);
  const joinCode = generatedJoinId;
  const calendarDays = routeCalendarDays(tripForm.startDate || "2026-06-01", tripForm.startDate, tripForm.endDate);
  const activeMobileStepIndex = Math.max(0, tripWizardSteps.findIndex((step) => step.id === activeMobileStep));
  const activeMobileStepMeta = tripWizardSteps[activeMobileStepIndex] ?? tripWizardSteps[0];
  const previousMobileStep = tripWizardSteps[activeMobileStepIndex - 1] ?? null;
  const nextMobileStep = tripWizardSteps[activeMobileStepIndex + 1] ?? null;
  const isMobilePreviewStep = activeMobileStep === "preview";
  const currentStepComplete = tripStepComplete(activeMobileStep, {
    accessComplete,
    datesComplete,
    destinationComplete,
    tripNameComplete: Boolean(tripForm.name.trim()),
  });
  const missingFields = [
    tripForm.name.trim() ? null : wizard.status.fields.trip,
    destinationComplete ? null : wizard.status.fields.destination,
    datesComplete ? null : wizard.status.fields.dates,
    accessComplete ? null : wizard.status.fields.invite,
  ].filter(Boolean).join(", ");
  const createStatusText = canSubmit ? wizard.status.ready : wizard.status.required({ fields: missingFields });

  useEffect(() => {
    onChange((current) => {
      const nextJoinId = generateJoinIdForTrip(current.startDate, selectedDestinationKey.split("|").filter(Boolean), accessSalt);
      const nextJoinPassword = current.joinPassword.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/) ? current.joinPassword : generateJoinPassword();
      if (current.joinId === nextJoinId && current.joinPassword === nextJoinPassword) return current;
      return { ...current, joinId: nextJoinId, joinPassword: nextJoinPassword };
    });
  }, [accessSalt, onChange, selectedDestinationKey]);

  useEffect(() => {
    mobileStepButtonRefs.current.get(activeMobileStep)?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [activeMobileStep]);

  function seedOwnerDisplayName() {
    onChange((current) => current.ownerDisplayName.trim() ? current : { ...current, ownerDisplayName: defaultOwnerDisplayName });
  }

  function regenerateCredentials() {
    const nextSalt = randomToken(3);
    setAccessSalt(nextSalt);
    onChange((current) => ({
      ...current,
      joinId: generateJoinIdForTrip(current.startDate, selectedDestinationNames, nextSalt),
      joinPassword: generateJoinPassword(),
    }));
  }

  function updateDestinationCities(nextCities: TripCity[]) {
    const nextCountries = uniqueList(nextCities.map((city) => city.country));
    onChange((current) => ({
      ...current,
      countries: nextCountries,
      destinationCities: nextCities,
      destinationLabel: nextCities.map((city) => city.city).join(", "),
    }));
    setCountryQuery("");
    setCityQuery("");
  }

  function selectDestinationCity(city: TripCityOption) {
    if (selectedDestinationCities.some((selected) => selected.city.toLocaleLowerCase() === city.city.toLocaleLowerCase() && selected.countryCode === city.countryCode)) return;
    updateDestinationCities([...selectedDestinationCities, tripCityFromOption(city)]);
  }

  function focusDestinationSearch() {
    destinationSearchRef.current?.focus();
  }

  function swapTravelDates() {
    onChange((current) => ({ ...current, startDate: current.endDate, endDate: current.startDate }));
  }

  function updateStartDate(date: string) {
    onChange((current) => {
      if (!date || !current.endDate) return { ...current, startDate: date };
      if (Date.parse(`${date}T00:00:00`) > Date.parse(`${current.endDate}T00:00:00`)) {
        return { ...current, startDate: current.endDate, endDate: date };
      }
      return { ...current, startDate: date };
    });
  }

  function updateEndDate(date: string) {
    onChange((current) => {
      if (!date || !current.startDate) return { ...current, endDate: date };
      if (Date.parse(`${date}T00:00:00`) < Date.parse(`${current.startDate}T00:00:00`)) {
        return { ...current, startDate: date, endDate: current.startDate };
      }
      return { ...current, endDate: date };
    });
  }

  function addCityStop() {
    const nextCity = (countryQuery || cityQuery).trim();
    if (!nextCity || selectedDestinationNames.some((name) => name.toLocaleLowerCase() === nextCity.toLocaleLowerCase())) return;
    updateDestinationCities([...selectedDestinationCities, customTripCity(nextCity, selectedDestinationCities[0])]);
  }

  function removeCityStop(cityName: string) {
    updateDestinationCities(selectedDestinationCities.filter((city) => city.city !== cityName));
  }

  function selectCalendarDate(date: string) {
    if (selectingDateStep === "depart") {
      onChange((current) => ({ ...current, startDate: date, endDate: Date.parse(`${current.endDate}T00:00:00`) < Date.parse(`${date}T00:00:00`) ? date : current.endDate }));
      setSelectingDateStep("return");
      return;
    }
    onChange((current) => {
      if (current.startDate && Date.parse(`${date}T00:00:00`) < Date.parse(`${current.startDate}T00:00:00`)) {
        return { ...current, startDate: date, endDate: current.startDate };
      }
      return { ...current, endDate: date };
    });
    setSelectingDateStep("depart");
  }

  function clearTravelDates() {
    onChange((current) => ({ ...current, startDate: "", endDate: "" }));
    setSelectingDateStep("depart");
  }

  async function copyJoinCode() {
    const text = joinCode.trim();
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
      setHasCopiedJoinCode(true);
    } catch {
      setHasCopiedJoinCode(false);
    }
  }

  function mobileStepClassName(stepId: TripWizardStepId, baseClassName = tripStepSectionClassName) {
    return cn(baseClassName, activeMobileStep === stepId ? "" : "max-[767px]:hidden");
  }

  function submitWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    seedOwnerDisplayName();
    const nextForm = { ...tripForm, joinId: generatedJoinId, joinPassword: generatedJoinPassword };
    onChange(nextForm);
    if (canSubmit && !isSubmitting) onSubmit(nextForm);
  }

  return (
    <form className={cn(accountSettingsFormClassName, portalCreateTripInlineClassName)} aria-label={wizard.title} onSubmit={submitWizard}>
      <div className={tripSimpleHeadClassName}>
        <div>
          <strong>{wizard.title} <Badge tone={canSubmit ? "success" : "neutral"}>{canSubmit ? wizard.statusReady : wizard.statusDraft}</Badge></strong>
          <p>{wizard.detail}</p>
        </div>
      </div>
      <nav className={tripWorkflowNavClassName} aria-label="Trip creation workflow">
        <ol>
          {tripWizardSteps.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                aria-current={activeMobileStep === step.id ? "step" : undefined}
                aria-label={`${wizard.stepNames[step.id]} step`}
                onClick={() => setActiveMobileStep(step.id)}
                ref={(node) => {
                  if (node) mobileStepButtonRefs.current.set(step.id, node);
                  else mobileStepButtonRefs.current.delete(step.id);
                }}
              >
                {wizard.stepNames[step.id]}
              </button>
            </li>
          ))}
        </ol>
        <p>{wizard.workflow[activeMobileStepMeta.id]}</p>
      </nav>
      <div className={tripWizardLayoutClassName}>
        <div className={cn(tripWizardMainClassName, isMobilePreviewStep ? "max-[767px]:hidden" : "")}>
          <div className={tripWizardPaneClassName}>
            <div className={tripScopePanelClassName}>
              <section
                className={mobileStepClassName("trip")}
                role="region"
                aria-label={tripWizardSteps[0].regionLabel}
                data-mobile-active={activeMobileStep === "trip" ? "true" : "false"}
              >
                <div className={tripStepHeadingClassName}>
                  <strong>{wizard.steps.trip.title}</strong>
                  <span>{wizard.steps.trip.detail}</span>
                </div>
                <label className={tripNameFieldClassName}>
                  <span className="sr-only">{t.access.dashboard.createTrip.labels.name}</span>
                <input
                  value={tripForm.name}
                  onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
                    placeholder={wizard.placeholders.tripName}
                    maxLength={100}
                  required
                />
                  <small>{tripForm.name.length} / 100</small>
                </label>
              </section>

              <section
                className={mobileStepClassName("place")}
                role="region"
                aria-label={tripWizardSteps[1].regionLabel}
                data-mobile-active={activeMobileStep === "place" ? "true" : "false"}
              >
                <div className={tripStepHeadingClassName}>
                  <strong>{wizard.steps.place.title}</strong>
                  <span>{wizard.steps.place.detail}</span>
                </div>
                <div className={tripCountryPickerClassName}>
                  <label className={tripCountrySearchClassName}>
                    <span>{wizard.fields.originCity}</span>
                    <input aria-label={wizard.fields.originCity} value={tripForm.originLabel} readOnly />
                  </label>
                  <div className={tripCountrySearchClassName}>
                    <label>
                      <span className="sr-only">{wizard.fields.searchDestinationCities}</span>
                      <input
                        aria-label={wizard.fields.searchDestinationCities}
                        ref={destinationSearchRef}
                        value={cityQuery}
                        onChange={(event) => setCityQuery(event.target.value)}
                        placeholder={wizard.placeholders.destinationSearch}
                      />
                    </label>
                    {suggestedCities.length ? (
                      <div className={tripCountrySuggestionsClassName} aria-label="Destination city suggestions">
                        {suggestedCities.map((city) => (
                          <button type="button" key={`${city.city}-${city.countryCode}`} aria-label={`${city.city}, ${city.country}`} onClick={() => selectDestinationCity(city)}>
                            <strong>{city.city}</strong>
                            <span>{city.country} · {city.countryCode} · {city.timezone}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {selectedCityNames.length ? (
                    <div className={tripFormDestinationRowClassName} aria-label="Selected destinations">
                      {destinationCards.map((card) => (
                        <article key={card.title} className={tripMiniDestinationClassName}>
                          <span className={tripPlaceThumbClassName} aria-hidden="true" />
                          <div>
                            <strong>{card.title}</strong>
                            <DestinationCardMeta detail={card.detail} meta={card.meta} />
                          </div>
                          <button type="button" aria-label={`Remove ${card.title}`} onClick={() => removeCityStop(card.title)}>
                            <Icon name="x" />
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={tripSelectedCountriesClassName} aria-label="Selected destinations">
                      <span>{wizard.empty.selectedDestinations}</span>
                    </div>
                  )}
                  <div className={tripCityEntryClassName}>
                    <label>
                      <span>{wizard.fields.addCityManually}</span>
                      <input
                        aria-label={wizard.fields.addCityOrStop}
                        value={countryQuery}
                        onChange={(event) => setCountryQuery(event.target.value)}
                        placeholder={wizard.placeholders.manualCity}
                      />
                    </label>
                    <Button type="button" variant="secondary" onClick={addCityStop} disabled={!countryQuery.trim()}>
                      <Icon name="plus" />
                      {wizard.actions.addCity}
                    </Button>
                  </div>
                </div>
              </section>

              <section
                className={mobileStepClassName("dates")}
                role="region"
                aria-label={tripWizardSteps[2].regionLabel}
                data-mobile-active={activeMobileStep === "dates" ? "true" : "false"}
              >
                <div className={tripStepHeadingClassName}>
                  <strong>{wizard.steps.dates.title}</strong>
                  <span>{wizard.steps.dates.detail}</span>
                </div>
              <fieldset className={tripRouteCalendarClassName} role="group" aria-label={wizard.fields.routeCalendar}>
                <legend>{wizard.fields.routeCalendar}</legend>
                <div className={tripCalendarSummaryClassName}>
                  <label>
                    <span>{wizard.fields.depart}</span>
                    <DatePickerField
                      aria-label={t.access.dashboard.createTrip.labels.startDate}
                      value={tripForm.startDate}
                      onChange={updateStartDate}
                    />
                  </label>
                  <label>
                    <span>{wizard.fields.return}</span>
                    <DatePickerField
                      aria-label={t.access.dashboard.createTrip.labels.endDate}
                      value={tripForm.endDate}
                      onChange={updateEndDate}
                    />
                  </label>
                </div>
                <strong>{previewStartDate} - {previewEndDate}</strong>
                <div className={tripCalendarGridClassName}>
                  {calendarDays.map((day) => (
                    <button
                      type="button"
                      key={day.value}
                      aria-label={`${day.tourDay ? `Tour day ${day.tourDay}. ` : ""}Select ${day.label} as ${selectingDateStep} date`}
                      aria-pressed={day.value === tripForm.startDate || day.value === tripForm.endDate}
                      data-in-range={day.inRange ? "true" : "false"}
                      data-date-state={day.dateState}
                      data-tour-tone={day.tourTone}
                      onClick={() => selectCalendarDate(day.value)}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
                <div className={tripCalendarFooterClassName}>
                  <Button type="button" variant="secondary" onClick={clearTravelDates}>
                    <Icon name="x" />
                    {wizard.actions.clearDates}
                  </Button>
                  <button className={tripDateArrowClassName} type="button" onClick={swapTravelDates} aria-label={wizard.actions.swapDates}>
                    <Icon name="route" />
                  </button>
                </div>
                <small className={tripCalendarHelperClassName}>
                  <Icon name="route" />
                  <span>{wizard.helper.datesWindow}</span>
                </small>
              </fieldset>
              </section>

              <section
                className={mobileStepClassName("invite", tripStepSectionCompactClassName)}
                role="region"
                aria-label={tripWizardSteps[3].regionLabel}
                data-mobile-active={activeMobileStep === "invite" ? "true" : "false"}
              >
              <details className={tripAccessPanelClassName} {...(activeMobileStep === "invite" ? { open: true } : {})}>
                <summary>
                    <span>{wizard.steps.invite.title}</span>
                  <strong>{effectiveOwnerDisplayName || defaultOwnerDisplayName}</strong>
                </summary>
                <label>
                  <span>{t.access.dashboard.createTrip.labels.ownerDisplayName}</span>
                  <input
                    value={effectiveOwnerDisplayName}
                    onChange={(event) => {
                      setHasEditedOwnerDisplayName(true);
                      onChange((current) => ({ ...current, ownerDisplayName: event.target.value }));
                    }}
                    autoComplete="name"
                    required
                  />
                  <small>{wizard.helper.ownerDefault}</small>
                </label>
                <div className={tripGeneratedAccessClassName}>
                  <label>
                    <span>{t.access.dashboard.createTrip.labels.joinId}</span>
                    <input value={generatedJoinId} readOnly />
                    <small>{wizard.helper.joinIdHint}</small>
                  </label>
                  <label>
                    <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
                    <input value={generatedJoinPassword} readOnly />
                  </label>
                  <Button type="button" variant="secondary" onClick={regenerateCredentials}>
                    <Icon name="route" />
                    {wizard.actions.regenerate}
                  </Button>
                </div>
              </details>
              </section>

              <div className={tripAccessNoteClassName}>
                <Icon name="key" />
                <span>{wizard.helper.postCreateEditable}</span>
              </div>
              <div className={tripTicketReviewClassName}>
                <div>
                  <span>{wizard.review.trip}</span>
                  <strong>{tripForm.name || wizard.empty.newTrip}</strong>
                </div>
                <div>
                  <span>{wizard.review.destinations}</span>
                  <strong>{destinationSummary}</strong>
                </div>
                <div>
                  <span>{wizard.review.dates}</span>
                  <strong>{tripForm.startDate && tripForm.endDate ? `${tripForm.startDate} - ${tripForm.endDate}` : wizard.empty.missingDates}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className={cn(tripLivePreviewClassName, isMobilePreviewStep ? "" : "max-[767px]:hidden")} role="region" aria-label="Live trip preview">
          <section
            className={mobileStepClassName("preview", "trip-preview-step grid")}
            role="region"
            aria-label={tripWizardSteps[4].regionLabel}
            data-mobile-active={activeMobileStep === "preview" ? "true" : "false"}
          >
          <div className={tripBoardingPassClassName}>
            <div className={tripMainTicketClassName}>
              <div className={tripPreviewTicketTopClassName}>
                <span>{wizard.preview.label}</span>
              </div>
              <strong>{previewTripName}</strong>
              <p>{wizard.preview.tripId}: TRP-26-0001 <Badge tone={canSubmit ? "success" : "neutral"}>{canSubmit ? wizard.statusReady : wizard.statusDraft}</Badge></p>
              <div className={tripFlightRouteClassName}>
                <div>
                  <strong>{destinationRouteCode([tripForm.originCity])}</strong>
                  <span>{tripForm.originCity}</span>
                </div>
                <span className={tripFlightLineClassName}><Icon name="route" /></span>
                <div>
                  <strong>{routeDestinationCode}</strong>
                  <span>{selectedCityNames[0] ?? wizard.empty.destination}</span>
                </div>
              </div>
              <TripPreviewLiveMap originCity={tripCityFromFormOrigin(tripForm)} destinationCities={selectedDestinationCities} />
              <div className={tripPreviewDestinationRowClassName}>
                <span>{wizard.preview.destinations}</span>
                <div>
                  {destinationCards.map((card) => (
                    <article key={card.title} className={tripPreviewDestinationCardClassName}>
                      <strong>{card.title}</strong>
                      <DestinationCardMeta detail={card.detail} meta={card.meta} />
                      <Badge tone="primary">{card.nights}</Badge>
                    </article>
                  ))}
                  <button className={tripMiniAddClassName} type="button" onClick={focusDestinationSearch}>
                    <Icon name="plus" />
                    {wizard.actions.addDestination}
                  </button>
                </div>
              </div>
            </div>
            <div className={tripTicketStubClassName}>
              <Icon name="route" />
              <div>
                <strong>{previewStartDate} - {previewEndDate}</strong>
                <span>{previewNightCount}</span>
              </div>
              <div>
                <span>{wizard.preview.currency}</span>
                <strong>{currencySummary}</strong>
              </div>
              <div>
                <span>{wizard.preview.status}</span>
                <Badge tone={canSubmit ? "warning" : "neutral"}>{inviteStatus}</Badge>
              </div>
            </div>
          </div>
          </section>
          <div className={cn(tripShareStripClassName, "max-[767px]:hidden")}>
            <span><Icon name="users" /> {wizard.preview.shareCode}</span>
            <span>{wizard.preview.joinCode} <strong>{joinCode}</strong></span>
            <Button type="button" variant="secondary" onClick={() => void copyJoinCode()}>
              {hasCopiedJoinCode ? wizard.actions.copied : wizard.actions.copy}
            </Button>
            <span><Icon name="key" /> {wizard.preview.shareLinkPending}</span>
          </div>
        </aside>
      </div>
      <div className={tripMobileStepActionsClassName} aria-label="Mobile step controls">
        <Button
          type="button"
          variant="secondary"
          disabled={!previousMobileStep}
          aria-label={previousMobileStep ? `${wizard.actions.back}: ${wizard.stepNames[previousMobileStep.id]}` : wizard.actions.back}
          onClick={() => previousMobileStep ? setActiveMobileStep(previousMobileStep.id) : undefined}
        >
          <Icon name="chevronLeft" />
          {wizard.actions.back}
        </Button>
        <span>{activeMobileStepIndex + 1} / {tripWizardSteps.length}</span>
        <Button
          type="button"
          variant="secondary"
          disabled={!nextMobileStep || !currentStepComplete}
          aria-label={nextMobileStep ? `${wizard.actions.next}: ${wizard.stepNames[nextMobileStep.id]}` : wizard.actions.next}
          onClick={() => nextMobileStep ? setActiveMobileStep(nextMobileStep.id) : undefined}
        >
          {wizard.actions.next}
          <Icon name="chevronRight" />
        </Button>
      </div>
      <div className={tripWizardActionsClassName} role="group" aria-label="Create trip status">
        <p className={tripWizardActionStatusClassName}>
          <Icon name={canSubmit ? "check" : "key"} />
          {createStatusText}
        </p>
        <div className={tripWizardActionSummaryClassName} aria-hidden="true">
          <strong>{previewTripName}</strong>
          <span>{destinationSummary}</span>
          <span>{previewStartDate} - {previewEndDate} · {previewNightCount}</span>
        </div>
        <div className={tripWizardActionButtonsClassName}>
          <Button asChild type="button" variant="secondary">
            <Link href={appRoutes.portalMyTrips()}>
              <Icon name="chevronLeft" />
              {wizard.actions.cancel}
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !canSubmit}>
            <Icon name="check" />
            {isSubmitting ? wizard.actions.creating : wizard.actions.create}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DestinationCardMeta({ detail, meta }: { detail: string; meta: string }) {
  const parts = [detail, ...destinationMetaParts(meta)].filter(Boolean);
  if (!parts.length) return null;

  return (
    <small>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          <span>{part}</span>
        </span>
      ))}
    </small>
  );
}

function destinationMetaParts(meta: string): string[] {
  return meta.split(" · ").map((part) => part.trim()).filter(Boolean);
}

function tripDestinationCards(selectedCountryNames: string[], selectedCityNames: string[] = [], locale: string = "en"): Array<{ title: string; detail: string; meta: string; nights: string; countryName: string }> {
  const cards: Array<{ title: string; detail: string; meta: string; nights: string; countryName: string }> = [];
  selectedCityNames.forEach((cityName, index) => {
    const cityCountryName = destinationCityCountryName(cityName);
    cards.push({ title: cityName, detail: cityCountryName ?? selectedCountryNames[0] ?? "City stop", meta: destinationCityMeta(cityName), nights: tripNightBadge(index + 2, locale), countryName: cityCountryName ?? cityName });
  });
  selectedCountryNames
    .filter((name) => !selectedCityNames.some((cityName) => cityBelongsToCountry(cityName, name)))
    .forEach((name, index) => {
      cards.push({ title: name, detail: name, meta: countryCurrencyDetail(name), nights: tripNightBadge(index + 3, locale), countryName: name });
    });
  if (cards.length) return cards.slice(0, 4);
  return [{ title: "Destination", detail: "Trip stop", meta: "", nights: tripNightBadge(3, locale), countryName: "Destination" }];
}

function destinationCityMeta(cityName: string): string {
  const city = tripCityOptions.find((option) => option.city.toLocaleLowerCase() === cityName.toLocaleLowerCase());
  if (!city) return "";
  const currency = tripCountryOptions.find((country) => country.name === city.country)?.currency;
  return [city.timezone, currency].filter(Boolean).join(" · ");
}

function countryCurrencyDetail(countryName: string): string {
  const country = tripCountryOptions.find((option) => option.name === countryName);
  return country?.currency ?? "";
}

function tripNightBadge(nights: number, locale: string): string {
  return locale === "th" ? `${nights} คืน` : `${nights} nights`;
}

function destinationCityCountryName(cityName: string): string | null {
  return tripCountryOptions.find((country) => country.cities.some((city) => city.toLocaleLowerCase() === cityName.toLocaleLowerCase()))?.name ?? null;
}

function cityBelongsToCountry(cityName: string, countryName: string): boolean {
  return destinationCityCountryName(cityName)?.toLocaleLowerCase() === countryName.toLocaleLowerCase();
}

function formatPreviewTravelDate(value: string): string {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function routeCalendarDays(seed: string, startDate: string, endDate: string): Array<{ value: string; day: string; label: string; inRange: boolean; tourDay: number | null; tourTone: "odd" | "even" | "none"; dateState: "start" | "end" | "in-range" | "today" | "default" }> {
  const seedDate = new Date(`${seed || "2026-06-01"}T00:00:00`);
  const year = Number.isNaN(seedDate.getTime()) ? 2026 : seedDate.getFullYear();
  const month = Number.isNaN(seedDate.getTime()) ? 5 : seedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  const todayValue = localDateValue(new Date());
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const value = localDateValue(date);
    const time = date.getTime();
    const inRange = Number.isFinite(start) && Number.isFinite(end) && time >= Math.min(start, end) && time <= Math.max(start, end);
    const tourDay = inRange ? Math.round((time - Math.min(start, end)) / 86_400_000) + 1 : null;
    const dateState = value === startDate ? "start" : value === endDate ? "end" : inRange ? "in-range" : value === todayValue ? "today" : "default";
    return {
      value,
      day: String(index + 1),
      label: new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date),
      inRange,
      tourDay,
      tourTone: tourDay ? (tourDay % 2 ? "odd" : "even") : "none",
      dateState,
    };
  });
}

function localDateValue(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function tripNightCount(startDate: string, endDate: string, locale: string): string {
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return locale === "th" ? "ยังไม่กำหนด" : "Not set";
  const days = Math.round((end - start) / 86_400_000);
  return locale === "th" ? `${days} คืน (${days + 1} วัน)` : `${days} nights (${days + 1} days)`;
}

function TripPreviewLiveMap({ originCity, destinationCities }: { originCity: TripCity; destinationCities: TripCity[] }) {
  const routeCities = useMemo(() => [originCity, ...destinationCities], [destinationCities, originCity]);
  const coordinates = useMemo(() => routeCities.map((city) => [city.longitude, city.latitude] as [number, number]), [routeCities]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<Array<import("maplibre-gl").Marker>>([]);
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const liveMapEnabled = process.env.NODE_ENV !== "test";

  useEffect(() => {
    if (!liveMapEnabled || destinationCities.length === 0 || !mapContainerRef.current) return undefined;
    let disposed = false;
    const markers = markersRef.current;

    async function mountMap() {
      setMapState("loading");

      try {
        const maplibregl = await import("maplibre-gl");
        const container = mapContainerRef.current;
        if (!container || disposed) return;
        container.inert = true;
        container.tabIndex = -1;

        const map = new maplibregl.Map({
          attributionControl: { compact: true },
          center: previewMapCenter(coordinates),
          container,
          interactive: false,
          style: "https://tiles.openfreemap.org/styles/positron",
          zoom: coordinates.length > 1 ? 2.4 : 3.2,
        });
        mapRef.current = map;

        coordinates.forEach((coordinate, index) => {
          const markerElement = document.createElement("span");
          markerElement.className = tripPreviewLiveMarkerClassName;
          markerElement.textContent = String(index + 1);
          markerElement.setAttribute("aria-hidden", "true");
          const marker = new maplibregl.Marker({ element: markerElement })
            .setLngLat(coordinate)
            .addTo(map);
          markers.push(marker);
        });

        map.on("load", () => {
          if (disposed) return;
          fitPreviewMap(map, coordinates);
          container.inert = false;
          setMapState("ready");
        });
        map.on("error", () => {
          if (!disposed) setMapState("error");
        });
      } catch {
        if (!disposed) setMapState("error");
      }
    }

    void mountMap();

    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove());
      markers.length = 0;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [coordinates, destinationCities.length, liveMapEnabled]);

  return (
    <div className={cn(tripPreviewMapClassName, tripPreviewMapLiveClassName, mapState === "ready" ? tripPreviewMapReadyClassName : "")}>
      <div className={tripPreviewMapCanvasClassName} ref={mapContainerRef} aria-hidden="true" />
      {mapState !== "ready" ? (
        <div className={tripPreviewMapFallbackClassName}>
          <FlightRouteFallback originCity={originCity} destinationCity={destinationCities[0]} />
          <span className={cn(tripPreviewPinClassName, tripPreviewPinOriginClassName)}><Icon name="location" /></span>
          <span className={cn(tripPreviewPinClassName, tripPreviewPinDestinationClassName)}><Icon name="map" /></span>
          <span className={tripPreviewRouteLineClassName} />
        </div>
      ) : null}
      <span className={tripPreviewMapSourceClassName}>
        <Icon name="map" />
        OpenFreeMap live map
      </span>
    </div>
  );
}

function FlightRouteFallback({ originCity, destinationCity }: { originCity: TripCity; destinationCity?: TripCity }) {
  const destination = destinationCity ?? customTripCity("Destination", originCity);
  return (
    <div className={tripCountrySvgFallbackClassName} aria-label={`Flight route from ${originCity.city} to ${destination.city}`}>
      <div>
        <strong>{originCity.countryCode}</strong>
        <span>{originCity.city}</span>
      </div>
      <Icon name="route" />
      <div>
        <strong>{destination.countryCode}</strong>
        <span>{destination.city}</span>
      </div>
    </div>
  );
}

function previewMapCenter(coordinates: Array<[number, number]>): [number, number] {
  const totals = coordinates.reduce(
    (current, coordinate) => [current[0] + coordinate[0], current[1] + coordinate[1]] as [number, number],
    [0, 0] as [number, number],
  );
  return [totals[0] / coordinates.length, totals[1] / coordinates.length];
}

function fitPreviewMap(map: import("maplibre-gl").Map, coordinates: Array<[number, number]>) {
  if (coordinates.length <= 1) {
    map.flyTo({ center: coordinates[0], zoom: 3.2, duration: 0 });
    return;
  }
  const lngs = coordinates.map((coordinate) => coordinate[0]);
  const lats = coordinates.map((coordinate) => coordinate[1]);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
  map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 4.2 });
}

function normalizedTripForm(form: AccountTripCreateRequest, defaultOwnerDisplayName: string): AccountTripCreateRequest {
  const name = form.name.trim();
  const destinationCities = form.destinationCities.map((city) => ({
    ...city,
    city: city.city.trim(),
    country: city.country.trim(),
    countryCode: city.countryCode.trim().toUpperCase(),
    timezone: city.timezone.trim(),
  })).filter((city) => city.city && city.country && city.countryCode);
  const countryNames = uniqueList(destinationCities.map((city) => city.country));
  return {
    ...form,
    name,
    originLabel: form.originLabel.trim() || "Bangkok, Thailand",
    originCity: form.originCity.trim() || "Bangkok",
    originCountry: form.originCountry.trim() || "Thailand",
    originCountryCode: form.originCountryCode.trim().toUpperCase() || "TH",
    countries: countryNames,
    destinationCities,
    destinationLabel: destinationCities.length ? destinationCities.map((city) => city.city).join(", ") : form.destinationLabel.trim() || name,
    ownerDisplayName: form.ownerDisplayName.trim() || defaultOwnerDisplayName,
    joinId: form.joinId.trim().toUpperCase(),
    joinPassword: form.joinPassword.trim().toUpperCase(),
  };
}

function citySuggestions(query: string, selectedCities: TripCity[]): TripCityOption[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return tripCityOptions
    .filter((city) => !selectedCities.some((selected) => selected.city === city.city && selected.countryCode === city.countryCode))
    .filter((city) => {
      if (!normalizedQuery) return true;
      return [city.city, city.country, city.countryCode, city.airportCode]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    })
    .slice(0, normalizedQuery ? 8 : 6);
}

function tripCityFromOption(option: TripCityOption): TripCity {
  return {
    city: option.city,
    country: option.country,
    countryCode: option.countryCode,
    timezone: option.timezone,
    latitude: option.latitude,
    longitude: option.longitude,
  };
}

function originCityFromProfile(profile?: AccountSettings["profile"] | null): TripCityOption {
  const profileCity = profile?.homeCity?.trim();
  const profileCountry = profile?.homeCountry?.trim();
  if (profileCity) {
    const exact = tripCityOptions.find((city) => city.city.toLocaleLowerCase() === profileCity.toLocaleLowerCase() && (!profileCountry || city.country.toLocaleLowerCase() === profileCountry.toLocaleLowerCase()));
    if (exact) return exact;
  }
  if (profileCountry) {
    const capital = tripCityOptions.find((city) => city.capital && city.country.toLocaleLowerCase() === profileCountry.toLocaleLowerCase());
    if (capital) return capital;
  }
  return tripCityOptions.find((city) => city.city === "Bangkok" && city.countryCode === "TH") ?? {
    city: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    timezone: "Asia/Bangkok",
    latitude: 13.7563,
    longitude: 100.5018,
    airportCode: "BKK",
    capital: true,
  };
}

function customTripCity(city: string, fallback?: TripCity): TripCity {
  const match = tripCityOptions.find((option) => option.city.toLocaleLowerCase() === city.toLocaleLowerCase());
  if (match) return tripCityFromOption(match);
  return {
    city,
    country: fallback?.country ?? "Thailand",
    countryCode: fallback?.countryCode ?? "TH",
    timezone: fallback?.timezone ?? "Asia/Bangkok",
    latitude: fallback?.latitude ?? 13.7563,
    longitude: fallback?.longitude ?? 100.5018,
  };
}

function tripCityFromFormOrigin(form: AccountTripCreateRequest): TripCity {
  const match = tripCityOptions.find((option) => option.city === form.originCity && option.countryCode === form.originCountryCode);
  if (match) return tripCityFromOption(match);
  return {
    city: form.originCity || "Bangkok",
    country: form.originCountry || "Thailand",
    countryCode: form.originCountryCode || "TH",
    timezone: "Asia/Bangkok",
    latitude: 13.7563,
    longitude: 100.5018,
  };
}

function tripStepComplete(step: TripWizardStepId, state: { tripNameComplete: boolean; destinationComplete: boolean; datesComplete: boolean; accessComplete: boolean }): boolean {
  if (step === "trip") return state.tripNameComplete;
  if (step === "place") return state.destinationComplete;
  if (step === "dates") return state.datesComplete;
  if (step === "invite") return state.accessComplete;
  return true;
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values));
}

function generateJoinId(): string {
  return generateJoinIdForTrip(new Date().toISOString().slice(0, 10), [], randomToken(3));
}

function generateJoinIdForTrip(startDate: string, destinations: string[], suffix = randomToken(3)): string {
  const date = new Date(`${startDate}T00:00:00`);
  const month = Number.isNaN(date.getTime()) ? "00" : String(date.getMonth() + 1).padStart(2, "0");
  const year = Number.isNaN(date.getTime()) ? "00" : String(date.getFullYear()).slice(-2);
  return `${month}${year}-${destinationRouteCode(destinations)}-${suffix}`.toUpperCase();
}

function destinationRouteCode(destinations: string[]): string {
  const primary = destinations[destinations.length > 1 ? 1 : 0] ?? destinations[0] ?? "TRP";
  const city = tripCityOptions.find((option) => option.city.toLocaleLowerCase() === primary.toLocaleLowerCase());
  if (city) return city.airportCode;
  const option = tripCountryOptions.find((country) => country.name === primary || country.cities.some((cityName) => cityName.toLocaleLowerCase() === primary.toLocaleLowerCase()));
  if (option) return option.code;
  return primary.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
}

function generateJoinPassword(): string {
  return `${randomToken(4)}-${randomToken(4)}`;
}

function buildInviteLink(joinCode: string, token?: string | null): string {
  const basePath = token ? `${appRoutes.join()}?token=${encodeURIComponent(token)}` : appRoutes.join(joinCode);
  if (typeof window === "undefined") return basePath;
  return `${window.location.origin}${basePath}`;
}

function buildInviteEmailHref(tripName: string, inviteLink: string): string {
  const subject = `Join ${tripName}`;
  const body = `Join this trip in Joii: ${inviteLink}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function randomToken(length: number): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const values = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256);
  }
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function readPreviousPortalSectionIndex(fallbackIndex: number): number {
  if (typeof window === "undefined") return fallbackIndex;
  const storedIndex = Number(window.sessionStorage.getItem(portalSectionStorageKey));
  return Number.isFinite(storedIndex) ? storedIndex : fallbackIndex;
}

function PortalStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div className={portalSkeletonCardClassName} key={index}>
          <span className={portalSkeletonNumberClassName} />
          <span className={portalSkeletonShortClassName} />
        </div>
      ))}
    </>
  );
}

function PortalListSkeleton({ compact = false, rows }: { compact?: boolean; rows: number }) {
  return (
    <div className={compact ? portalListSkeletonCompactClassName : portalListSkeletonClassName} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className={portalSkeletonRowClassName} key={index}>
          <span className={portalSkeletonIconClassName} />
          <span className={portalSkeletonLineClassName} />
          <span className={portalSkeletonShortClassName} />
        </div>
      ))}
    </div>
  );
}

function AccountSettingsEditor({
  accountClient,
  accountSession,
  onError,
  onMessage,
  onSessionCleared,
  onSettingsChanged,
  settings,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onSessionCleared: () => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings;
}) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState<AccountSettingsUpdateRequest>(() => profileToForm(settings));
  const [isSaving, setIsSaving] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const nextSettings = await accountClient.updateSettings(accountSession.sessionToken, form);
      onSettingsChanged(nextSettings);
      setForm(profileToForm(nextSettings));
      onMessage(t.access.settings.messages.saved);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.saveFailed, t.access.messages));
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeDevice(deviceId: string) {
    setRevokingDeviceId(deviceId);
    try {
      await accountClient.revokeTrustedDevice(accountSession.sessionToken, deviceId);
      if (accountSession.trustedDeviceId === deviceId) {
        onSessionCleared();
        onMessage(t.access.settings.messages.currentDeviceRevoked);
        onError(null);
        return;
      }
      const nextSettings = await accountClient.loadSettings(accountSession.sessionToken);
      onSettingsChanged(nextSettings);
      onMessage(t.access.settings.messages.deviceRevoked);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.revokeFailed, t.access.messages));
    } finally {
      setRevokingDeviceId(null);
    }
  }

  return (
    <>
      <div className={settingsProfilePreviewClassName}>
        <span className={accountAvatarClassName} style={{ backgroundColor: form.avatarColor }} aria-hidden="true">
          {form.displayName.slice(0, 1) || "A"}
        </span>
        <div>
          <strong>{form.displayName}</strong>
          <span>{settings.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
        </div>
      </div>
      <form className={accountSettingsFormClassName} onSubmit={submitSettings}>
        <div className={accountTwoColClassName}>
          <label>
            <span>{t.access.settings.form.displayName}</span>
            <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
          </label>
          <label>
            <span>{t.access.settings.form.avatarColor}</span>
            <input
              value={form.avatarColor}
              onChange={(event) => setForm((current) => ({ ...current, avatarColor: event.target.value }))}
              pattern="#[0-9a-fA-F]{6}"
              type="color"
              required
            />
          </label>
          <label>
            <span>{t.access.settings.form.locale}</span>
            <select value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} required>
              <option value="th-TH">Thai</option>
              <option value="en-US">English</option>
            </select>
          </label>
          <label>
            <span>{t.access.settings.form.timezone}</span>
            <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required />
          </label>
          <label>
            <span>Home city</span>
            <input value={form.homeCity ?? ""} onChange={(event) => setForm((current) => ({ ...current, homeCity: event.target.value }))} placeholder="Bangkok" />
          </label>
          <label>
            <span>Home country</span>
            <input value={form.homeCountry ?? ""} onChange={(event) => setForm((current) => ({ ...current, homeCountry: event.target.value }))} placeholder="Thailand" />
          </label>
        </div>
        <Button type="submit" disabled={isSaving}>
          <Icon name="check" />
          {t.access.settings.form.save}
        </Button>
      </form>

      <div className={accountSettingsGridClassName}>
        <SettingLine label={t.access.settings.passkeys} value={`${settings.passkeys.length}`} />
        <SettingLine label={t.access.settings.trustedDevices} value={`${settings.trustedDevices.length}`} />
      </div>

      <div className={accountDeviceListClassName} aria-label={t.access.settings.trustedDevicesLabel}>
        {settings.trustedDevices.length ? (
          settings.trustedDevices.map((device) => (
            <div className={accountDeviceRowClassName} key={device.id}>
              <div>
                <strong>{device.label}</strong>
                <span>
                  {device.userAgent || t.access.settings.unknownBrowser} ·{" "}
                  {device.lastSeenAt ? formatDateTime(device.lastSeenAt, locale) : formatDateTime(device.createdAt, locale)}
                </span>
              </div>
              <Button type="button" variant="secondary" onClick={() => void revokeDevice(device.id)} disabled={revokingDeviceId === device.id}>
                <Icon name="x" />
                {t.access.settings.revoke}
              </Button>
            </div>
          ))
        ) : (
          <p className={accountEmptyClassName}>{t.access.settings.noTrustedDevices}</p>
        )}
      </div>
    </>
  );
}

function PanelHeading({ detail, icon, title }: { detail: string; icon: ComponentProps<typeof Icon>["name"]; title: string }) {
  return (
    <div className={accountPanelHeadingClassName}>
      <span aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function PortalEmptyState({
  actionHref,
  actionLabel,
  detail,
  icon,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  detail: string;
  icon: ComponentProps<typeof Icon>["name"];
  title: string;
}) {
  return (
    <div className={portalEmptyStateClassName}>
      <span aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <Button asChild variant="secondary">
        <Link href={actionHref}>
          <Icon name="plus" />
          {actionLabel}
        </Link>
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={accountStatClassName}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SettingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className={accountSettingLineClassName}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusMessage({ children, id, tone }: { children: ReactNode; id?: string; tone: "danger" | "success" }) {
  return (
    <p className={tone === "danger" ? accountDangerStatusClassName : accountSuccessStatusClassName} id={id} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={tone === "danger" ? "alertCircle" : "check"} />
      {children}
    </p>
  );
}

function errorMessage(caught: unknown, fallback: string, labels: Messages["access"]["messages"]): string {
  return localizeAccessError(rawErrorMessage(caught, fallback), labels) ?? fallback;
}

function rawErrorMessage(caught: unknown, fallback: string): string {
  if (isApiLikeError(caught)) return caught.code || String(caught.status);
  if (caught instanceof Error && caught.message) {
    const normalized = caught.message.trim();
    if (normalized) return normalized;
  }
  return fallback;
}

function localizeAccessError(message: string | null, labels: Messages["access"]["messages"]): string | null {
  if (!message) return null;
  return friendlyErrorText(message, null, labels);
}

function friendlyErrorText(message: string, fallback: string | null, labels: Messages["access"]["messages"]): string | null {
  const normalized = message.trim();
  if (normalized === ACCESS_ERROR_CODES.accountLoadFailed) return labels.accountLoadFailed;
  if (normalized === ACCESS_ERROR_CODES.passkeyRegistrationCredential) return labels.passkeyRegistrationCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyLoginCredential) return labels.passkeyLoginCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyUnsupported) return labels.passkeyUnsupported;
  if (normalized === "not_found") return labels.notFound;
  if (normalized === "invalid_request") return labels.unauthorized;
  if (normalized === "email_delivery_failed") return labels.emailDeliveryFailed;
  if (normalized === "404") return labels.notFound;
  if (normalized === "401" || normalized === "403" || normalized === "unauthenticated" || normalized === "unauthorized" || normalized === "forbidden") return labels.unauthorized;
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return fallback;
}

function isApiLikeError(value: unknown): value is { code?: string; status?: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("code" in value || "status" in value) &&
      (typeof (value as { code?: unknown }).code === "string" || typeof (value as { status?: unknown }).status === "number"),
  );
}

function isUnauthenticated(value: unknown): boolean {
  return isApiLikeError(value) && value.status === 401;
}

function formatDateTime(value: string, locale: "en" | "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function profileToForm(settings: AccountSettings): AccountSettingsUpdateRequest {
  return {
    displayName: settings.profile.displayName,
    avatarColor: settings.profile.avatarColor,
    locale: settings.profile.locale,
    timezone: settings.profile.timezone,
    homeCity: settings.profile.homeCity ?? "",
    homeCountry: settings.profile.homeCountry ?? "",
  };
}

async function createPasskeyCredential(challenge: string, settings: AccountSettings) {
  const credentials = assertCredentialApi();
  const userName = settings.profile.primaryEmail ?? settings.profile.displayName;
  const rpId = getPasskeyRpId();
  const credential = await credentials.create({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      rp: { name: "Joii", ...(rpId ? { id: rpId } : {}) },
      user: {
        id: new TextEncoder().encode(settings.profile.id),
        name: userName,
        displayName: settings.profile.displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
      timeout: 60_000,
    },
  });

  if (!isRegistrationCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyRegistrationCredential);
  }

  return credential;
}

async function getPasskeyCredential(challenge: string, credentialIds: string[]) {
  const credentials = assertCredentialApi();
  const credential = await credentials.get({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      allowCredentials: credentialIds.map((credentialId) => ({
        type: "public-key",
        id: base64UrlToArrayBuffer(credentialId),
      })),
      userVerification: "required",
      timeout: 60_000,
    },
  });

  if (!isAssertionCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyLoginCredential);
  }

  return credential;
}

type RegistrationCredential = PublicKeyCredential & {
  response: AuthenticatorAttestationResponse;
};

type AssertionCredential = PublicKeyCredential & {
  response: AuthenticatorAssertionResponse;
};

function assertCredentialApi(): CredentialsContainer {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    throw new Error(ACCESS_ERROR_CODES.passkeyUnsupported);
  }
  return navigator.credentials;
}

function isRegistrationCredential(credential: Credential | null): credential is RegistrationCredential {
  return isPublicKeyCredential(credential) && "attestationObject" in credential.response && credential.response.attestationObject instanceof ArrayBuffer;
}

function isAssertionCredential(credential: Credential | null): credential is AssertionCredential {
  return (
    isPublicKeyCredential(credential) &&
    "authenticatorData" in credential.response &&
    "signature" in credential.response &&
    credential.response.authenticatorData instanceof ArrayBuffer &&
    credential.response.signature instanceof ArrayBuffer
  );
}

function getPasskeyRpId(): string | null {
  const rpHost = window.location.hostname;
  if (!rpHost) return null;
  if (rpHost === "localhost") return rpHost;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(rpHost)) return null;
  if (/^([0-9a-fA-F:]+)$/.test(rpHost)) return null;
  return rpHost;
}

function isPublicKeyCredential(credential: Credential | null): credential is PublicKeyCredential {
  return (
    !!credential &&
    "rawId" in credential &&
    credential.rawId instanceof ArrayBuffer &&
    "response" in credential &&
    typeof credential.response === "object" &&
    credential.response !== null &&
    "clientDataJSON" in credential.response &&
    credential.response.clientDataJSON instanceof ArrayBuffer
  );
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}
