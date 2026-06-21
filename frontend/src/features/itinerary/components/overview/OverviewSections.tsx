import { type ReactNode } from "react";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { getTripDates } from "@/src/trip/itinerary-core";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { DestinationVisual } from "@/src/features/itinerary/domain/overview";
import { viewerNextStopDetail } from "@/src/features/itinerary/domain/overview";
import {
  overviewFocusListClassName,
  overviewHeroAsideClassName,
  overviewHeroBaseClassName,
  overviewHeroCopyClassName,
  overviewHeroKickerClassName,
  overviewHeroMetaClassName,
  overviewHeroRoleClassName,
  overviewHeroSettlementsClassName,
  overviewHeroToneClassNames,
  overviewMutedClassName,
  overviewNextStopClassName,
  overviewHeroTitleClassName,
  overviewStopListClassName,
  tripCompletedClassName,
} from "./overview.styles";
import {
  formatOverviewStopSchedule,
  formatOverviewStopScheduleWithPlace,
} from "./overview-stop-labels";

export function ViewerNextStopPanel({
  item,
  startDate,
  locale,
  emptyMessage,
  detailFallback,
}: {
  item: ItineraryItem | undefined;
  startDate: string;
  locale: Locale;
  emptyMessage: string;
  detailFallback: string;
}) {
  /* v8 ignore next */
  return item ? (
    <div className={overviewNextStopClassName}>
      <strong>{item.activity}</strong>
      <span>{formatOverviewStopScheduleWithPlace(item, startDate, locale)}</span>
      <p>{viewerNextStopDetail(item, detailFallback)}</p>
    </div>
  ) : (
    <p className={overviewMutedClassName}>{emptyMessage}</p>
  );
}

export function OverviewStopList({ items, startDate, locale, emptyMessage }: { items: ItineraryItem[]; startDate: string; locale: Locale; emptyMessage: string }) {
  if (!items.length) return <p className={overviewMutedClassName}>{emptyMessage}</p>;

  return (
    <ul className={overviewStopListClassName}>
      {items.map((item) => (
        <li key={item.id}>
          <span>{formatOverviewStopSchedule(item, startDate, locale)}</span>
          <strong>{item.activity}</strong>
          <small>{item.place}</small>
        </li>
      ))}
    </ul>
  );
}

export function OverviewFocusList({ items, startDate, locale, label }: { items: ItineraryItem[]; startDate: string; locale: Locale; label: string }) {
  if (items.length <= 1) return null;

  return (
    <ul className={overviewFocusListClassName} aria-label={label}>
      {items.slice(1).map((item) => (
        <li key={item.id}>
          <span>{formatOverviewStopSchedule(item, startDate, locale)}</span>
          <strong>{item.activity}</strong>
        </li>
      ))}
    </ul>
  );
}

export function TripCompletedPostcard({ trip, items, groupSpendLabel, locale }: { trip: Trip; items: ItineraryItem[]; groupSpendLabel: string; locale: Locale }) {
  const dayCount = getTripDates(trip.startDate, trip.endDate).length;
  const stopCount = items.length;

  return (
    <div className={tripCompletedClassName}>
      <div className="absolute top-4 right-4 flex h-14 w-12 rotate-[6deg] select-none flex-col items-center justify-center rounded-(--radius-sm) border-2 border-dashed border-(--color-warning-border) opacity-70">
        <Icon name="location" className="size-5 text-(--color-warning-strong)" />
        <span className="mt-0.5 font-mono text-[7px] font-black uppercase tracking-normal text-(--color-warning-strong)">Joii Map</span>
      </div>

      <div className="flex max-w-[85%] flex-col gap-2.5">
        <strong className="flex items-center gap-1.5 text-base font-extrabold leading-tight text-(--color-text)">
          <Icon name="calendar" className="size-4.5 text-(--color-warning-strong)" />
          {locale === "th" ? "ขอบคุณสำหรับการเดินทาง!" : "Thank you for traveling!"}
        </strong>
        <p className="m-0 text-xs font-bold leading-relaxed text-(--color-text-muted)">
          {locale === "th"
            ? `ทริป ${trip.name} ได้เสร็จสิ้นลงแล้วอย่างสมบูรณ์แบบ หวังว่าคุณจะได้รับความทรงจำและมิตรภาพที่ยอดเยี่ยมระหว่างเดินทาง!`
            : `The ${trip.name} has completed. Hope this journey left you with beautiful memories and meaningful connections!`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-(--color-warning-border) pt-4 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{locale === "th" ? "ระยะเวลา" : "Duration"}</span>
          <strong className="text-lg font-black text-(--color-text)">{dayCount} {locale === "th" ? "วัน" : "Days"}</strong>
        </div>
        <div className="flex flex-col gap-0.5 border-x border-(--color-warning-border)">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{locale === "th" ? "สถานที่เช็คอิน" : "Places Visited"}</span>
          <strong className="text-lg font-black text-(--color-text)">{stopCount} {locale === "th" ? "จุด" : "Stops"}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{locale === "th" ? "ยอดใช้จ่ายรวม" : "Total Budget"}</span>
          <strong className="text-lg font-black text-(--color-text)">{groupSpendLabel}</strong>
        </div>
      </div>
    </div>
  );
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
}: {
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
}) {
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
          <span><Icon name="calendar" /> {dateRange}</span>
          <span><Icon name="location" /> {visual.label}</span>
          <span><Icon name="users" /> {activeMembersLabel}</span>
          <span><Icon name="wallet" /> {groupSpendLabel}</span>
        </div>
      </div>
      <div className={overviewHeroAsideClassName}>
        {currentMemberCard}
        <span className={overviewHeroSettlementsClassName}>{t.overview.money.settlementsCount({ count: settlementCount })}</span>
      </div>
    </section>
  );
}

export { HighlightBoard } from "./OverviewHighlightBoard";
