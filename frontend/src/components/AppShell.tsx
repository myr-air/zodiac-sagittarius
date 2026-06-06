"use client";

import { useState, type ReactNode } from "react";
import type { PlanningView } from "@/src/app/SagittariusApp";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { appRoutes, tripWorkspaceNavItems } from "@/src/routes/app-routes";
import { decodeTripId } from "@/src/trip/ids";
import type { Member, Trip } from "@/src/trip/types";
import { Icon } from "./icons";

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

export function resolveViewFromPath(pathname: string, tripId: string, initialView: PlanningView): PlanningView {
  const normalizedPath = pathname.replace(/\/+$/, "");

  if (!normalizedPath.startsWith("/trips/")) return initialView;

  const rawTripSegment = normalizedPath.slice("/trips/".length).split("/")[0];
  const decodedTripSegment = decodeTripId(rawTripSegment);
  if (decodedTripSegment !== tripId) return initialView;

  if (normalizedPath === `/trips/${rawTripSegment}`) return initialView;
  if (!normalizedPath.startsWith(`/trips/${rawTripSegment}/`)) return initialView;

  const viewSegment = normalizedPath.slice(`/trips/${rawTripSegment}/`.length).split("/")[0];

  if (viewSegment === "itinerary") return "itinerary";
  if (viewSegment === "map") return "map";
  if (viewSegment === "timeline") return "timeline";
  if (viewSegment === "members") return "members";
  if (viewSegment === "expenses") return "expenses";
  if (viewSegment === "settings") return "settings";
  return initialView;
}

const brandRowClassName = "brand-row inline-flex min-h-[62px] items-center justify-between px-3.5 pl-4 data-[collapsed=true]:px-[5px] data-[collapsed=true]:pl-2 max-[1199px]:px-[5px] max-[1199px]:pl-2 max-[767px]:min-h-[54px]";
const brandBlockClassName = "brand-block inline-flex min-w-0 items-center gap-[11px]";
const brandMarkClassName = "brand-mark grid size-[30px] place-items-center rounded-(--radius-sm) bg-(--color-primary) text-white font-extrabold [&_.icon]:size-[19px] [&_.icon]:stroke-[2.4]";
const brandCopyClassName = "brand-copy data-[collapsed=true]:hidden max-[1199px]:hidden max-[767px]:!hidden";
const brandNameClassName = "text-xl font-extrabold leading-7 text-(--color-primary-strong)";
const railToggleClassName = "rail-toggle inline-flex min-h-9 w-9 items-center justify-center border-0 bg-transparent text-(--color-text-muted) transition-[color,background] duration-150 hover:bg-(--color-primary-soft) hover:text-(--color-primary) data-[collapsed=true]:rounded-(--radius-sm) data-[collapsed=true]:border data-[collapsed=true]:border-(--color-border) data-[collapsed=true]:bg-(--color-surface) data-[collapsed=true]:[&_.icon]:size-4";
const appLayoutClassName = "app-layout grid min-h-screen grid-cols-[228px_minmax(0,1fr)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.26),transparent_220px),transparent] data-[sidebar-collapsed=true]:grid-cols-[68px_minmax(0,1fr)] max-[1199px]:grid-cols-[68px_minmax(0,1fr)] max-[767px]:block";
const sideRailClassName = "side-rail sticky top-0 z-[5] grid h-screen grid-rows-[62px_1fr_auto_auto] gap-0 overflow-hidden border-r border-(--color-border) bg-(--color-surface) max-[767px]:static max-[767px]:h-auto max-[767px]:grid-rows-[auto_auto] max-[767px]:border-b max-[767px]:border-r-0 max-[767px]:pb-2";
const railLinksClassName = "rail-links grid content-start gap-1 overflow-y-auto px-2.5 pb-3 pt-2.5 max-[767px]:flex max-[767px]:overflow-x-auto max-[767px]:pb-2 max-[767px]:pt-0";
const railLinkClassName = "rail-link relative inline-flex min-h-10 items-center gap-[13px] rounded-(--radius-md) px-[13px] text-[13px] font-semibold text-[#334155] no-underline transition-[background,color] duration-150 hover:bg-(--color-surface-subtle) hover:text-(--color-primary-strong) data-[collapsed=true]:justify-center data-[collapsed=true]:px-0 max-[1199px]:justify-center max-[1199px]:px-0 max-[767px]:min-h-[38px] max-[767px]:flex-none";
const activeRailLinkClassName = "rail-link--active bg-[linear-gradient(90deg,rgb(15_118_110_/_0.12),rgb(15_118_110_/_0.04))] text-(--color-primary-strong) before:absolute before:left-[-10px] before:h-7 before:w-[3px] before:rounded-full before:bg-(--color-primary) before:content-['']";
const railLinkLabelClassName = "data-[collapsed=true]:hidden max-[1199px]:hidden max-[767px]:!inline";
const sideRailLanguageClassName = "side-rail-language mx-3.5 mb-1 mt-2 self-start data-[collapsed=true]:mx-0 data-[collapsed=true]:self-center data-[collapsed=true]:[&_.language-switch-option]:min-w-[27px] data-[collapsed=true]:[&_.language-switch-option]:px-0 max-[1199px]:mx-0 max-[1199px]:self-center max-[1199px]:[&_.language-switch-option]:min-w-[27px] max-[1199px]:[&_.language-switch-option]:px-0";
const memberCardBaseClassName = "member-card mx-2.5 mb-5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-[11px] data-[collapsed=true]:mx-2 data-[collapsed=true]:flex data-[collapsed=true]:min-h-[54px] data-[collapsed=true]:justify-center data-[collapsed=true]:p-2 max-[1199px]:mx-2 max-[1199px]:flex max-[1199px]:min-h-[54px] max-[1199px]:justify-center max-[1199px]:p-2 max-[767px]:hidden";
const memberCardGridClassName = "grid min-h-[82px] grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5";
const memberCardColClassName = "flex flex-col items-stretch gap-2.5 min-h-[auto]";
const memberAvatarClassName = "person-avatar grid size-[30px] place-items-center rounded-full text-xs font-extrabold text-white";
const memberCardCopyClassName = "grid min-w-0 gap-0.5 data-[collapsed=true]:hidden max-[1199px]:hidden";
const memberCardNameClassName = "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-extrabold leading-[18px] text-(--color-text)";
const memberCardRoleClassName = "text-(--color-text-muted)";
const memberSwitchButtonClassName = "member-switch-button min-h-7 whitespace-nowrap rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-extrabold text-(--color-primary-strong) data-[collapsed=true]:hidden max-[1199px]:hidden";
const memberFallbackIconClassName = "data-[collapsed=true]:hidden max-[1199px]:hidden";
const identityDialogBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const identityDialogClassName = "identity-switch-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_24px_70px_rgb(15_23_42_/_0.22)]";
const identityDialogTitleClassName = "m-0 text-base font-extrabold leading-[22px] text-(--color-text)";
const identityDialogBodyClassName = "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const identityDialogActionsClassName = "mt-1 flex justify-end gap-2";
const identityDialogButtonClassName = "inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-sm font-extrabold text-(--color-primary-strong)";
const identityDialogPrimaryButtonClassName = "inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-(--radius-sm) border border-(--color-primary) bg-(--color-primary) px-3 text-sm font-extrabold text-white";

export function AppShell({ activeView, children, collapsed, currentMember, onLeaveParticipantSession, onNavigateView, trip, onToggleCollapsed }: AppShellProps) {
  const { t } = useI18n();
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const navItems = tripWorkspaceNavItems(trip.id, t.routes);
  const settingsHref = appRoutes.tripSettings(trip.id);

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
            </div>
          </div>

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
        </div>

        <div className={railLinksClassName}>
          {navItems.map((item) => (
            <a
              aria-current={item.id === activeView ? "page" : undefined}
              className={cn(railLinkClassName, item.id === activeView && activeRailLinkClassName)}
              data-collapsed={collapsed ? "true" : "false"}
              href={item.href}
              key={item.id}
              onClick={onNavigateView ? (event) => {
                event.preventDefault();
                onNavigateView(item.id, item.href);
              } : undefined}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span className={railLinkLabelClassName} data-collapsed={collapsed ? "true" : "false"}>{item.label}</span>
            </a>
          ))}
          <a
            aria-current={activeView === "settings" ? "page" : undefined}
            className={cn(railLinkClassName, activeView === "settings" && activeRailLinkClassName)}
            data-collapsed={collapsed ? "true" : "false"}
            href={settingsHref}
            onClick={onNavigateView ? (event) => {
              event.preventDefault();
              onNavigateView("settings", settingsHref);
            } : undefined}
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

function roleLabel(role: Member["role"], roles: Record<Member["role"], string>): string {
  return roles[role];
}
