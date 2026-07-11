"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes, tripWorkspaceNavItems } from "@/src/routes/app-routes";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { AppShellProps } from "./app-shell.types";
import {
  appLayoutClassName,
  sideRailClassName,
  sideRailLanguageClassName,
} from "./AppShell.styles";
import { AppShellBrandHeader } from "./AppShellBrandHeader";
import { AppShellMemberCard } from "./AppShellMemberCard";
import { AppShellRailNavigation } from "./AppShellRailNavigation";

export function AppShell({
  accountPortalHref,
  activeView,
  children,
  collapsed,
  currentMember,
  onLeaveParticipantSession,
  onNavigateView,
  phase,
  trip,
  onToggleCollapsed,
}: AppShellProps) {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const navItems = tripWorkspaceNavItems(trip.id, t.routes, phase);
  const settingsView: PlanningView = "settings";
  const settingsHref = appRoutes.tripSettings(trip.id);
  const activeNavLabel =
    activeView === settingsView
      ? t.appShell.nav.settings
      : (navItems.find((item) => item.id === activeView)?.label ??
        t.appShell.nav.overview);

  useEffect(() => {
    const activeLink = activeLinkRef.current;
    if (typeof activeLink?.scrollIntoView === "function") {
      activeLink.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [activeView]);

  return (
    <div
      className={appLayoutClassName}
      data-sidebar-collapsed={collapsed ? "true" : "false"}
    >
      <nav
        className={sideRailClassName}
        data-collapsed={collapsed ? "true" : "false"}
        aria-label={t.appShell.navLabel}
      >
        <AppShellBrandHeader
          activeNavLabel={activeNavLabel}
          collapsed={collapsed}
          collapseNavigationLabel={t.appShell.collapseNavigation}
          expandNavigationLabel={t.appShell.expandNavigation}
          mobileMenuOpen={mobileMenuOpen}
          closeNavigationLabel={t.appShell.closeNavigation}
          openNavigationLabel={t.appShell.openNavigation}
          onToggleCollapsed={onToggleCollapsed}
          onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
          tripName={trip.name}
        />

        <AppShellRailNavigation
          activeLinkRef={activeLinkRef}
          activeView={activeView}
          collapsed={collapsed}
          mobileMenuOpen={mobileMenuOpen}
          navItems={navItems}
          onNavigateView={onNavigateView}
          settingsHref={settingsHref}
          settingsLabel={t.appShell.nav.settings}
          settingsView={settingsView}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <LanguageSwitch
          className={sideRailLanguageClassName}
          data-collapsed={collapsed ? "true" : "false"}
        />

        <AppShellMemberCard
          accountPortalHref={accountPortalHref}
          collapsed={collapsed}
          currentMember={currentMember}
          onLeaveParticipantSession={onLeaveParticipantSession}
        />
      </nav>

      {children}
    </div>
  );
}
