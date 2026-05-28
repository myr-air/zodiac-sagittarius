import type { ReactNode } from "react";
import Link from "next/link";
import type { PlanningView } from "@/src/app/SagittariusApp";
import type { Member, Trip } from "@/src/trip/types";
import { getTripDates } from "@/src/trip/itinerary";
import { Icon } from "./icons";

const navItems = [
  { id: "overview", label: "ภาพรวมแผน", icon: "home" as const, href: "/" },
  { id: "itinerary", label: "แผนการเดินทาง", icon: "calendar" as const, href: "/itinerary" },
  { id: "map", label: "แผนที่", icon: "map" as const, href: "/map" },
  { id: "timeline", label: "ไทม์ไลน์", icon: "list" as const, href: "/timeline" },
  { id: "places", label: "สถานที่", icon: "location" as const, href: "/itinerary" },
  { id: "notes", label: "โน้ต", icon: "note" as const, href: "/itinerary" },
  { id: "documents", label: "เอกสาร", icon: "document" as const, href: "/itinerary" },
  { id: "budget", label: "งบประมาณ", icon: "wallet" as const, href: "/itinerary" },
  { id: "bookings", label: "รายการจอง", icon: "table" as const, href: "/itinerary" },
  { id: "alerts", label: "การแจ้งเตือน", icon: "alertCircle" as const, count: 3, href: "/itinerary" },
  { id: "tasks", label: "งาน", icon: "check" as const, href: "/itinerary" },
  { id: "members", label: "สมาชิก", icon: "users" as const, href: "/itinerary" },
  { id: "settings", label: "ตั้งค่า", icon: "settings" as const, href: "/itinerary" },
];

interface AppShellProps {
  activeView: PlanningView;
  children: ReactNode;
  collapsed: boolean;
  currentMember: Member;
  trip: Trip;
  onToggleCollapsed: () => void;
}

export function AppShell({ activeView, children, collapsed, currentMember, trip, onToggleCollapsed }: AppShellProps) {
  const tripDays = getTripDates(trip.startDate, trip.endDate).length;

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
              {item.count ? <em>{item.count}</em> : null}
            </Link>
          ))}
        </div>

        <div className="rail-summary" aria-label="สรุปแผน">
          <strong>สรุปแผน</strong>
          <span><Icon name="calendar" /> {tripDays} วัน 5 คืน</span>
          <span><Icon name="location" /> {trip.itineraryItems.length + 5} สถานที่</span>
          <span><Icon name="wallet" /> ¥4,860.00</span>
          <button type="button">ดูสรุปรายละเอียด</button>
        </div>

        <div className="member-card">
          <span className="person-avatar" style={{ backgroundColor: currentMember.color }} aria-hidden="true">
            {currentMember.displayName.slice(0, 1)}
          </span>
          <div>
            <strong>{currentMember.displayName}</strong>
            <span>เจ้าของแผน</span>
          </div>
          <Icon name="chevronRight" />
        </div>
      </nav>

      {children}
    </div>
  );
}
