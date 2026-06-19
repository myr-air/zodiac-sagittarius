import { type ReactNode } from "react";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import {
  cockpitCardBaseClassName,
  cockpitCardButtonClassName,
} from "./overview.styles";

interface CockpitCardProps {
  icon: "calendar" | "location" | "users" | "wallet" | "route" | "check";
  label: string;
  ariaLabel?: string;
  value: string;
  detail: ReactNode;
  onClick?: () => void;
}

export function CockpitCard({ icon, label, ariaLabel, value, detail, onClick }: CockpitCardProps) {
  const iconColors = {
    route: "border border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)",
    wallet: "border border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)",
    users: "border border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)",
    calendar: "border border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)",
    location: "border border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)",
    check: "border border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)",
  }[icon] || "border border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted)";
  const cardTone = {
    route: "[--overview-cockpit-accent:var(--color-route)] [--overview-cockpit-wash:var(--color-route-soft)]",
    wallet: "[--overview-cockpit-accent:var(--color-warning-strong)] [--overview-cockpit-wash:var(--color-warning-soft)]",
    users: "[--overview-cockpit-accent:var(--color-primary)] [--overview-cockpit-wash:var(--color-primary-soft)]",
    calendar: "[--overview-cockpit-accent:var(--color-primary)] [--overview-cockpit-wash:var(--color-primary-soft)]",
    location: "[--overview-cockpit-accent:var(--color-route)] [--overview-cockpit-wash:var(--color-route-soft)]",
    check: "[--overview-cockpit-accent:var(--color-success)] [--overview-cockpit-wash:var(--color-success-soft)]",
  }[icon] || "";

  const content = (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", iconColors)}>
          <Icon name={icon} className="size-4" />
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-normal text-(--color-text-muted)">
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 mt-1">
        <strong className="text-[22px] font-black leading-7 text-(--color-text) [overflow-wrap:anywhere]">
          {value}
        </strong>
        <div className="min-w-0 text-xs font-bold leading-[17px] text-(--color-text-muted) mt-0.5">
          {detail}
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        className={cn(cockpitCardBaseClassName, cardTone, cockpitCardButtonClassName, "active:translate-y-px")}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(cockpitCardBaseClassName, cardTone)}>
      {content}
    </div>
  );
}
