"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { Member, Trip } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { appRoutes, tripWorkspaceNavItems } from "@/src/trip/workspace/sagittarius-app/support";
import {
  activeRailLinkClassName,
  appLayoutClassName,
  brandBlockClassName,
  brandCopyClassName,
  brandMarkClassName,
  brandNameClassName,
  brandRowClassName,
  identityDialogActionsClassName,
  identityDialogBackdropClassName,
  identityDialogBodyClassName,
  identityDialogButtonClassName,
  identityDialogClassName,
  identityDialogPrimaryButtonClassName,
  identityDialogTitleClassName,
  memberAvatarClassName,
  memberCardBaseClassName,
  memberCardColClassName,
  memberCardCopyClassName,
  memberCardGridClassName,
  memberCardNameClassName,
  memberCardRoleClassName,
  memberFallbackIconClassName,
  memberSwitchButtonClassName,
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
import { roleLabel } from "./app-shell.support";

export { resolveViewFromPath } from "./app-shell.support";

interface AppShellProps {
  activeView: PlanningView;
  children: ReactNode;
  collapsed: boolean;
  currentMember: Member;
  onLeaveParticipantSession?: () => void;
  onNavigateView?: (view: PlanningView, href: string) => void;
  trip: Trip;
  onToggleCollapsed: () => void;
}

export function AppShell({ activeView, children, collapsed, currentMember, onLeaveParticipantSession, onNavigateView, trip, onToggleCollapsed }: AppShellProps) {
  const { t } = useI18n();
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const navItems = tripWorkspaceNavItems(trip.id, t.routes);
  const settingsHref = appRoutes.tripSettings(trip.id);
  const activeNavLabel = activeView === "settings"
    ? t.appShell.nav.settings
    : (navItems.find((item) => item.id === activeView)?.label ?? t.appShell.nav.overview);

  useEffect(() => {
    const activeLink = activeLinkRef.current;
    if (typeof activeLink?.scrollIntoView === "function") {
      activeLink.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [activeView]);

  function openLeaveParticipantSessionDialog() {
    if (!onLeaveParticipantSession) return;
    setIdentityDialogOpen(true);
  }

  function confirmLeaveParticipantSession() {
    setIdentityDialogOpen(false);
    onLeaveParticipantSession?.();
  }

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
            aria-current={activeView === "settings" ? "page" : undefined}
            className={cn(railLinkClassName, activeView === "settings" && activeRailLinkClassName)}
            data-collapsed={collapsed ? "true" : "false"}
            data-active={activeView === "settings" ? "true" : "false"}
            href={settingsHref}
            onClick={onNavigateView ? (event) => {
              event.preventDefault();
              setMobileMenuOpen(false);
              onNavigateView("settings", settingsHref);
            } : undefined}
            ref={activeView === "settings" ? activeLinkRef : undefined}
            title={t.appShell.nav.settings}
          >
            <Icon name="settings" />
            <span className={railLinkLabelClassName} data-collapsed={collapsed ? "true" : "false"}>{t.appShell.nav.settings}</span>
          </a>
        </div>

        <LanguageSwitch className={sideRailLanguageClassName} data-collapsed={collapsed ? "true" : "false"} />

        <div className={cn(memberCardBaseClassName, onLeaveParticipantSession && !collapsed ? memberCardColClassName : memberCardGridClassName)} data-collapsed={collapsed ? "true" : "false"}>
          {onLeaveParticipantSession && !collapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0 w-full">
                <span className={memberAvatarClassName} style={{ backgroundColor: currentMember.color }} aria-hidden="true">
                  {currentMember.displayName.slice(0, 1)}
                </span>
                <div className={memberCardCopyClassName} data-collapsed={collapsed ? "true" : "false"}>
                  <strong className={memberCardNameClassName}>{currentMember.displayName}</strong>
                  <span className={memberCardRoleClassName}>{roleLabel(currentMember.role, t.appShell.roles)}</span>
                </div>
              </div>
              <button className={memberSwitchButtonClassName} data-collapsed={collapsed ? "true" : "false"} type="button" onClick={openLeaveParticipantSessionDialog}>
                {t.appShell.switchIdentity}
              </button>
            </>
          ) : (
            <>
              <span className={memberAvatarClassName} style={{ backgroundColor: currentMember.color }} aria-hidden="true">
                {currentMember.displayName.slice(0, 1)}
              </span>
              <div className={memberCardCopyClassName} data-collapsed={collapsed ? "true" : "false"}>
                <strong className={memberCardNameClassName}>{currentMember.displayName}</strong>
                <span className={memberCardRoleClassName}>{roleLabel(currentMember.role, t.appShell.roles)}</span>
              </div>
              {onLeaveParticipantSession ? (
                <button className={memberSwitchButtonClassName} data-collapsed={collapsed ? "true" : "false"} type="button" onClick={openLeaveParticipantSessionDialog}>
                  {t.appShell.switchIdentity}
                </button>
              ) : (
                <Icon name="chevronRight" className={memberFallbackIconClassName} data-collapsed={collapsed ? "true" : "false"} />
              )}
            </>
          )}
        </div>
      </nav>

      {children}
      {identityDialogOpen ? (
        <div className={identityDialogBackdropClassName} role="presentation">
          <section className={identityDialogClassName} role="dialog" aria-modal="true" aria-labelledby="identity-switch-title">
            <h2 className={identityDialogTitleClassName} id="identity-switch-title">{t.appShell.switchIdentity}</h2>
            <p className={identityDialogBodyClassName}>{t.appShell.confirmSwitchIdentity({ name: currentMember.displayName })}</p>
            <div className={identityDialogActionsClassName}>
              <button className={identityDialogButtonClassName} type="button" onClick={() => setIdentityDialogOpen(false)}>
                {t.common.actions.cancel}
              </button>
              <button className={identityDialogPrimaryButtonClassName} type="button" onClick={confirmLeaveParticipantSession}>
                {t.appShell.switchIdentity}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
