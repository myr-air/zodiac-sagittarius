"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { appRoutes, tripWorkspaceNavItems } from "@/src/routes/app-routes";
import { Icon } from "@/src/ui/icons";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { AppShellProps } from "./app-shell.types";
import {
  activeRailLinkClassName,
  appLayoutClassName,
  brandBlockClassName,
  brandCopyClassName,
  brandMarkClassName,
  brandNameClassName,
  brandRowClassName,
  mobileMenuButtonClassName,
  mobilePageTitleClassName,
  mobileTripNameClassName,
  railLinkClassName,
  railLinkLabelClassName,
  railLinksClassName,
  railToggleClassName,
  sideRailClassName,
  sideRailLanguageClassName,
} from "./AppShell.styles";
import { AppShellMemberCard } from "./AppShellMemberCard";

export function AppShell({ activeView, children, collapsed, currentMember, onLeaveParticipantSession, onNavigateView, trip, onToggleCollapsed }: AppShellProps) {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const navItems = tripWorkspaceNavItems(trip.id, t.routes);
  const settingsView: PlanningView = "settings";
  const settingsHref = appRoutes.tripSettings(trip.id);
  const activeNavLabel = activeView === settingsView
    ? t.appShell.nav.settings
    : (navItems.find((item) => item.id === activeView)?.label ?? t.appShell.nav.overview);

  useEffect(() => {
    const activeLink = activeLinkRef.current;
    if (typeof activeLink?.scrollIntoView === "function") {
      activeLink.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [activeView]);

  return (
    <div className={appLayoutClassName} data-sidebar-collapsed={collapsed ? "true" : "false"}>
      <nav className={sideRailClassName} data-collapsed={collapsed ? "true" : "false"} aria-label={t.appShell.navLabel}>
        <div className={brandRowClassName} data-collapsed={collapsed ? "true" : "false"}>
          <div className={brandBlockClassName}>
            <div className={brandMarkClassName} aria-hidden="true">
              <Icon name="route" />
            </div>
            <div className={brandCopyClassName} data-collapsed={collapsed ? "true" : "false"}>
              <strong className={brandNameClassName}>Joii</strong>
              <span className={mobileTripNameClassName}>{trip.name}</span>
            </div>
          </div>
          <strong className={mobilePageTitleClassName}>{activeNavLabel}</strong>

          <button
            className={railToggleClassName}
            data-collapsed={collapsed ? "true" : "false"}
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? t.appShell.expandNavigation : t.appShell.collapseNavigation}
            onClick={onToggleCollapsed}
            title={collapsed ? t.appShell.expandNavigation : t.appShell.collapseNavigation}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} />
          </button>
          <button
            className={mobileMenuButtonClassName}
            type="button"
            aria-controls="mobile-workspace-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t.appShell.closeNavigation : t.appShell.openNavigation}
            onClick={() => setMobileMenuOpen((current) => !current)}
            title={mobileMenuOpen ? t.appShell.closeNavigation : t.appShell.openNavigation}
          >
            <Icon name={mobileMenuOpen ? "x" : "menu"} />
          </button>
        </div>

        <div
          className={railLinksClassName}
          data-mobile-open={mobileMenuOpen ? "true" : "false"}
          id="mobile-workspace-navigation"
        >
          {navItems.map((item) => {
            const isActive = item.id === activeView;
            return (
            <a
              aria-current={isActive ? "page" : undefined}
              className={cn(railLinkClassName, isActive && activeRailLinkClassName)}
              data-collapsed={collapsed ? "true" : "false"}
              data-active={isActive ? "true" : "false"}
              href={item.href}
              key={item.id}
              onClick={onNavigateView ? (event) => {
                event.preventDefault();
                setMobileMenuOpen(false);
                onNavigateView(item.id, item.href);
              } : undefined}
              ref={isActive ? activeLinkRef : undefined}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span className={railLinkLabelClassName} data-collapsed={collapsed ? "true" : "false"}>{item.label}</span>
            </a>
          );})}
          <a
            aria-current={activeView === settingsView ? "page" : undefined}
            className={cn(railLinkClassName, activeView === settingsView && activeRailLinkClassName)}
            data-collapsed={collapsed ? "true" : "false"}
            data-active={activeView === settingsView ? "true" : "false"}
            href={settingsHref}
            onClick={onNavigateView ? (event) => {
              event.preventDefault();
              setMobileMenuOpen(false);
              onNavigateView(settingsView, settingsHref);
            } : undefined}
            ref={activeView === settingsView ? activeLinkRef : undefined}
            title={t.appShell.nav.settings}
          >
            <Icon name="settings" />
            <span className={railLinkLabelClassName} data-collapsed={collapsed ? "true" : "false"}>{t.appShell.nav.settings}</span>
          </a>
        </div>

        <LanguageSwitch className={sideRailLanguageClassName} data-collapsed={collapsed ? "true" : "false"} />

        <AppShellMemberCard
          collapsed={collapsed}
          currentMember={currentMember}
          onLeaveParticipantSession={onLeaveParticipantSession}
        />
      </nav>

      {children}
    </div>
  );
}
