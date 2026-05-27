import type { ReactNode } from "react";
import type { Member } from "@/src/trip/types";
import { Icon } from "./icons";

const navItems = [
  { id: "cockpit", label: "Cockpit", icon: "layout" as const },
  { id: "table", label: "Smart table", icon: "table" as const },
  { id: "map", label: "Route map", icon: "map" as const },
  { id: "ideas", label: "Ideas", icon: "lightbulb" as const },
  { id: "expenses", label: "Expenses", icon: "wallet" as const },
  { id: "people", label: "People", icon: "users" as const },
];

interface AppShellProps {
  children: ReactNode;
  collapsed: boolean;
  currentMember: Member;
  onToggleCollapsed: () => void;
}

export function AppShell({ children, collapsed, currentMember, onToggleCollapsed }: AppShellProps) {
  return (
    <div className="app-layout" data-sidebar-collapsed={collapsed ? "true" : "false"}>
      <nav className="side-rail" data-collapsed={collapsed ? "true" : "false"} aria-label="Sagittarius planning navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">S</div>
          <div className="brand-copy">
            <strong>Sagittarius</strong>
            <span>Travel cockpit</span>
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

        <div className="rail-links">
          {navItems.map((item) => (
            <a className={item.id === "cockpit" ? "rail-link rail-link--active" : "rail-link"} href={`#${item.id}`} key={item.id} title={item.label}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        <div className="member-card">
          <span className="presence-dot" style={{ backgroundColor: currentMember.color }} aria-hidden="true" />
          <div>
            <strong>{currentMember.displayName}</strong>
            <span>{currentMember.role}</span>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
