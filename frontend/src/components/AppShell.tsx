"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { PlanningView } from "@/src/app/SagittariusApp";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { getMessages, type Messages } from "@/src/i18n/messages";
import { appRoutes, tripWorkspaceNavItems } from "@/src/routes/app-routes";
import type { Member, Trip } from "@/src/trip/types";
import { getTripDates } from "@/src/trip/itinerary";
import { Icon } from "./icons";

interface AppShellProps {
  activeView: PlanningView;
  children: ReactNode;
  collapsed: boolean;
  currentMember: Member;
  onLeaveParticipantSession?: () => void;
  onOpenExpenses?: () => void;
  trip: Trip;
  onToggleCollapsed: () => void;
}

export function AppShell({ activeView, children, collapsed, currentMember, onLeaveParticipantSession, onOpenExpenses, trip, onToggleCollapsed }: AppShellProps) {
  const { hasI18nProvider, t } = useAppShellTranslations();
  const tripDays = getTripDates(trip.startDate, trip.endDate).length;
  const tripNights = Math.max(0, tripDays - 1);
  const navItems = tripWorkspaceNavItems(trip.id, t.routes);

  function confirmLeaveParticipantSession() {
    if (!onLeaveParticipantSession) return;
    const confirmed = window.confirm(t.appShell.confirmSwitchIdentity({ name: currentMember.displayName }));
    if (confirmed) onLeaveParticipantSession();
  }

  return (
    <div className="app-layout" data-sidebar-collapsed={collapsed ? "true" : "false"}>
      <nav className="side-rail" data-collapsed={collapsed ? "true" : "false"} aria-label={t.appShell.navLabel}>
        <div className="brand-row">
          <div className="brand-block">
            <div className="brand-mark" aria-hidden="true">
              <Icon name="route" />
            </div>
            <div className="brand-copy">
              <strong>Sagittarius</strong>
            </div>
          </div>

          <button
            className="rail-toggle"
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? t.appShell.expandNavigation : t.appShell.collapseNavigation}
            onClick={onToggleCollapsed}
            title={collapsed ? t.appShell.expandNavigation : t.appShell.collapseNavigation}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} />
          </button>
        </div>

        <div className="rail-links">
          {navItems.map((item) => (
            <Link
              aria-current={item.id === activeView ? "page" : undefined}
              className={item.id === activeView ? "rail-link rail-link--active" : "rail-link"}
              href={item.href}
              key={item.id}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          {onOpenExpenses ? (
            <button className="rail-link rail-link-button" type="button" onClick={onOpenExpenses} title={t.appShell.nav.expenses}>
              <Icon name="wallet" />
              <span>{t.appShell.nav.expenses}</span>
            </button>
          ) : null}
        </div>

        {hasI18nProvider ? <LanguageSwitch className="side-rail-language" /> : null}

        <div className="rail-summary" aria-label={t.appShell.planSummary}>
          <strong>{t.appShell.planSummary}</strong>
          <span><Icon name="calendar" /> {t.appShell.tripDuration({ days: tripDays, nights: tripNights })}</span>
          <span><Icon name="location" /> {t.appShell.placeCount({ count: trip.itineraryItems.length })}</span>
          <Link href={appRoutes.tripOverview(trip.id)} className="rail-summary-link">{t.appShell.viewDetails}</Link>
        </div>

        <div className="member-card">
          <span className="person-avatar" style={{ backgroundColor: currentMember.color }} aria-hidden="true">
            {currentMember.displayName.slice(0, 1)}
          </span>
          <div>
            <strong>{currentMember.displayName}</strong>
            <span>{roleLabel(currentMember.role, t.appShell.roles)}</span>
          </div>
          {onLeaveParticipantSession ? (
            <button className="member-switch-button" type="button" onClick={confirmLeaveParticipantSession}>
              {t.appShell.switchIdentity}
            </button>
          ) : (
            <Icon name="chevronRight" />
          )}
        </div>
      </nav>

      {children}
    </div>
  );
}

function roleLabel(role: Member["role"], roles: Record<Member["role"], string>): string {
  return roles[role];
}

function useAppShellTranslations(): { hasI18nProvider: boolean; t: Messages } {
  try {
    return { hasI18nProvider: true, t: useI18n().t };
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "useI18n must be used within I18nProvider") {
      throw error;
    }

    return { hasI18nProvider: false, t: legacyAppShellMessages };
  }
}

const legacyAppShellMessages: Messages = {
  ...getMessages("th"),
  appShell: {
    ...getMessages("th").appShell,
    navLabel: "Sagittarius planning navigation",
    expandNavigation: "Expand navigation",
    collapseNavigation: "Collapse navigation",
  },
};
