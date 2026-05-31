import type { ReactNode } from "react";
import Link from "next/link";
import type { PlanningView } from "@/src/app/SagittariusApp";
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
  const tripDays = getTripDates(trip.startDate, trip.endDate).length;
  const tripNights = Math.max(0, tripDays - 1);
  const navItems = tripWorkspaceNavItems(trip.id);

  function confirmLeaveParticipantSession() {
    if (!onLeaveParticipantSession) return;
    const confirmed = window.confirm(`เปลี่ยนตัวตนจาก ${currentMember.displayName}? คุณจะต้องยืนยันตัวตนใหม่เพื่อกลับเข้ามา`);
    if (confirmed) onLeaveParticipantSession();
  }

  return (
    <div className="app-layout" data-sidebar-collapsed={collapsed ? "true" : "false"}>
      <nav className="side-rail" data-collapsed={collapsed ? "true" : "false"} aria-label="Sagittarius planning navigation">
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
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
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
            <button className="rail-link rail-link-button" type="button" onClick={onOpenExpenses} title="ค่าใช้จ่าย">
              <Icon name="wallet" />
              <span>ค่าใช้จ่าย</span>
            </button>
          ) : null}
        </div>

        <div className="rail-summary" aria-label="สรุปแผน">
          <strong>สรุปแผน</strong>
          <span><Icon name="calendar" /> {tripDays} วัน {tripNights} คืน</span>
          <span><Icon name="location" /> {trip.itineraryItems.length} สถานที่</span>
          <Link href={appRoutes.tripOverview(trip.id)} className="rail-summary-link">ดูสรุปรายละเอียด</Link>
        </div>

        <div className="member-card">
          <span className="person-avatar" style={{ backgroundColor: currentMember.color }} aria-hidden="true">
            {currentMember.displayName.slice(0, 1)}
          </span>
          <div>
            <strong>{currentMember.displayName}</strong>
            <span>{roleLabel(currentMember.role)}</span>
          </div>
          {onLeaveParticipantSession ? (
            <button className="member-switch-button" type="button" onClick={confirmLeaveParticipantSession}>
              เปลี่ยนตัวตน
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

function roleLabel(role: Member["role"]): string {
  if (role === "owner") return "เจ้าของแผน";
  if (role === "organizer") return "ผู้จัดทริป";
  if (role === "traveler") return "ผู้ร่วมเดินทาง";
  return "ผู้ชม";
}
