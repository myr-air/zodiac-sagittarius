"use client";

import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import {
  bottomNavClassName,
  bottomNavItemClassName,
  bottomNavActiveClassName,
  bottomNavInactiveClassName,
} from "./OnTripCompanionPage.styles";

export interface CompanionBottomNavProps {
  activeTab: "now" | "map" | "checklist" | "expenses";
  onTabChange: (tab: "now" | "map" | "checklist" | "expenses") => void;
  labels: {
    now: string;
    map: string;
    checklist: string;
    expenses: string;
  };
}

const tabs: Array<{ id: "now" | "map" | "checklist" | "expenses"; icon: "clock" | "map" | "list" | "wallet" }> = [
  { id: "now", icon: "clock" },
  { id: "map", icon: "map" },
  { id: "checklist", icon: "list" },
  { id: "expenses", icon: "wallet" },
];

export function CompanionBottomNav({ activeTab, onTabChange, labels }: CompanionBottomNavProps) {
  return (
    <nav
      className={cn(bottomNavClassName, "fixed bottom-0 left-0 right-0 md:sticky md:bottom-0")}
      aria-label="Companion navigation"
      data-testid="companion-bottom-nav"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            data-testid={`bottom-nav-${tab.id}`}
            className={cn(bottomNavItemClassName, isActive ? bottomNavActiveClassName : bottomNavInactiveClassName)}
          >
            <Icon name={tab.icon} className={isActive ? "text-(--color-primary)" : undefined} />
            <span>{labels[tab.id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
