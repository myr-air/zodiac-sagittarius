import type { ReactNode } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { IconText } from "@/src/shared/components/icon-text";
import type { DestinationVisual } from "@/src/features/itinerary/domain/overview";
import {
  overviewHeroAsideClassName,
  overviewHeroBaseClassName,
  overviewHeroCopyClassName,
  overviewHeroKickerClassName,
  overviewHeroMetaClassName,
  overviewHeroRoleClassName,
  overviewHeroSettlementsClassName,
  overviewHeroTitleClassName,
  overviewHeroToneClassNames,
} from "./overview.styles";

export interface OverviewHeroProps {
  title: string;
  roleTitle: string;
  destinationLabel: string;
  dateRange: string;
  activeMembersLabel: string;
  groupSpendLabel: string;
  settlementCount: number;
  visual: DestinationVisual;
  currentMemberCard: ReactNode;
  countdown: { text: string; type: "incoming" | "active" | "completed" };
}

export function OverviewHero({
  title,
  roleTitle,
  destinationLabel,
  dateRange,
  activeMembersLabel,
  groupSpendLabel,
  settlementCount,
  visual,
  currentMemberCard,
  countdown,
}: OverviewHeroProps) {
  const { t } = useI18n();
  return (
    <section className={cn(overviewHeroBaseClassName, overviewHeroToneClassNames[visual.tone])} aria-label={title}>
      <div className={overviewHeroCopyClassName}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={overviewHeroKickerClassName}>{destinationLabel}</span>
          <span className={cn(
            "text-[11px] font-extrabold px-2 py-0.5 rounded-full border",
            countdown.type === "incoming" && "bg-(--color-primary-soft) text-(--color-primary-strong) border-(--color-primary-border)",
            countdown.type === "active" && "bg-(--color-warning-soft) text-(--color-warning-strong) border-(--color-warning-border)",
            countdown.type === "completed" && "bg-(--color-surface-muted) text-(--color-text-muted) border-(--color-border)",
          )}>
            {countdown.text}
          </span>
        </div>
        <h1 className={overviewHeroTitleClassName}>{title}</h1>
        <p className={overviewHeroRoleClassName}>{roleTitle}</p>
        <div className={overviewHeroMetaClassName} aria-label="trip facts">
          <IconText icon="calendar">{dateRange}</IconText>
          <IconText icon="location">{visual.label}</IconText>
          <IconText icon="users">{activeMembersLabel}</IconText>
          <IconText icon="wallet">{groupSpendLabel}</IconText>
        </div>
      </div>
      <div className={overviewHeroAsideClassName}>
        {currentMemberCard}
        <span className={overviewHeroSettlementsClassName}>{t.overview.money.settlementsCount({ count: settlementCount })}</span>
      </div>
    </section>
  );
}
