"use client";

import Link from "next/link";
import type { Messages } from "@/src/i18n/messages";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { PortalSection } from "@/src/shared/portal";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { AccountAccessMode, AccountPanelMode } from "./account-access-modes";
import { heroDetail, heroTitle } from "./account-access-modes";
import {
  accountEntryBackHomeClassName,
  accountEntryBrandTaglineClassName,
  accountHeroClassName,
  accountHeroEyebrowClassName,
  accountHeroMarkClassName,
  accountModeTabsClassName,
  accountPortalHeroClassName,
  accountPortalHeroMarkClassName,
  accountPortalLanguageSwitchClassName,
  accountTabActiveClassName,
  accountTabClassName,
  backHomeButtonClassName,
  tripAccessBackHomeClassName,
  tripAccessLanguageSwitchClassName,
} from "./layout/account-access-panel-layout";
import { AuthHighlights, AuthTravelCollage } from "./account-entry-hero";
import { accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName } from "./layout/account-panel-shared-styles";
import type { AuthFlow } from "./auth";

interface AccountAccessChromeProps {
  accessMode: AccountAccessMode;
  backToHomeLabel: string;
  detailLabels: Messages["access"]["details"];
  entryFlow: AuthFlow;
  entryHeroLabels: Messages["access"]["entryHero"];
  highlightLabels: Messages["access"]["highlights"];
  isAccountEntry: boolean;
  isPortalEntry: boolean;
  isTripAccessEntry: boolean;
  mode: AccountPanelMode;
  onModeChange: (mode: AccountPanelMode) => void;
  portalSection: PortalSection;
  tabLabels: Messages["access"]["tabs"];
  titleLabels: Messages["access"]["titles"];
  eyebrowLabel: string;
}

function AccountBackHomeLink({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <Link href={appRoutes.home()} className={cn(backHomeButtonClassName, className)}>
      <Icon name="chevronLeft" className="size-3.5" />
      {label}
    </Link>
  );
}

export function AccountAccessChrome({
  accessMode,
  backToHomeLabel,
  detailLabels,
  entryFlow,
  entryHeroLabels,
  eyebrowLabel,
  highlightLabels,
  isAccountEntry,
  isPortalEntry,
  isTripAccessEntry,
  mode,
  onModeChange,
  portalSection,
  tabLabels,
  titleLabels,
}: AccountAccessChromeProps) {
  return (
    <>
      {isAccountEntry ? (
        <AccountBackHomeLink className={accountEntryBackHomeClassName} label={backToHomeLabel} />
      ) : null}
      {isTripAccessEntry ? (
        <>
          <AccountBackHomeLink className={tripAccessBackHomeClassName} label={backToHomeLabel} />
          <LanguageSwitch className={cn(accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName, tripAccessLanguageSwitchClassName)} />
        </>
      ) : null}
      {!isTripAccessEntry ? (
        <div className={cn(accountHeroClassName, isPortalEntry ? accountPortalHeroClassName : "")}>
          <div className={cn(accountHeroMarkClassName, isPortalEntry ? accountPortalHeroMarkClassName : "")} aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className={accountHeroEyebrowClassName}>{isAccountEntry ? entryHeroLabels.brand : eyebrowLabel}</p>
            {isAccountEntry ? <p className={accountEntryBrandTaglineClassName}>{entryHeroLabels.tagline}</p> : null}
            <h1>{isAccountEntry ? entryHeroLabels.title : heroTitle(accessMode, titleLabels)}</h1>
            <div className="h-6"></div>
            <p>{isAccountEntry ? entryHeroLabels.detail : heroDetail(accessMode, detailLabels)}</p>
            {isAccountEntry || (isPortalEntry && portalSection === "new-trip") ? null : <LanguageSwitch className={cn(accessLanguageSwitchClassName, isPortalEntry ? accountPortalLanguageSwitchClassName : "")} />}
          </div>
          {isAccountEntry ? <AuthTravelCollage labels={entryHeroLabels} /> : null}
          {isAccountEntry ? <AuthHighlights flow={entryFlow} highlights={highlightLabels} entryHero={entryHeroLabels} /> : null}
        </div>
      ) : null}
      {accessMode === "combined" ? (
        <div className={accountModeTabsClassName} role="tablist" aria-label={tabLabels.label}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "account"}
            className={cn(accountTabClassName, mode === "account" ? accountTabActiveClassName : "")}
            onClick={() => onModeChange("account")}
          >
            <Icon name="users" />
            {tabLabels.account}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "temp"}
            className={cn(accountTabClassName, mode === "temp" ? accountTabActiveClassName : "")}
            onClick={() => onModeChange("temp")}
          >
            <Icon name="clock" />
            {tabLabels.temp}
          </button>
        </div>
      ) : null}
    </>
  );
}
