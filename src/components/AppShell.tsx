import type { ReactNode } from "react";
import type { Member, Trip } from "@/src/trip/types";
import { getTripDates } from "@/src/trip/itinerary";
import { Icon } from "./icons";

const navItems = [
  { id: "overview", label: "ภาพรวมแผน", icon: "home" as const },
  { id: "itinerary", label: "แผนการเดินทาง", icon: "calendar" as const },
  { id: "map", label: "แผนที่", icon: "map" as const },
  { id: "timeline", label: "ไทม์ไลน์", icon: "list" as const },
  { id: "places", label: "สถานที่", icon: "location" as const },
  { id: "notes", label: "โน้ต", icon: "note" as const },
  { id: "documents", label: "เอกสาร", icon: "document" as const },
  { id: "budget", label: "งบประมาณ", icon: "wallet" as const },
  { id: "bookings", label: "รายการจอง", icon: "table" as const },
  { id: "alerts", label: "การแจ้งเตือน", icon: "alertCircle" as const, count: 3 },
  { id: "tasks", label: "งาน", icon: "check" as const },
  { id: "members", label: "สมาชิก", icon: "users" as const },
  { id: "settings", label: "ตั้งค่า", icon: "settings" as const },
];

interface AppShellProps {
  children: ReactNode;
  collapsed: boolean;
  currentMember: Member;
  trip: Trip;
  onToggleCollapsed: () => void;
}

export function AppShell({ children, collapsed, currentMember, trip, onToggleCollapsed }: AppShellProps) {
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
            <a
              className={item.id === "itinerary" ? "rail-link rail-link--active" : "rail-link"}
              href={`#${item.id}`}
              key={item.id}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.count ? <em>{item.count}</em> : null}
            </a>
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
