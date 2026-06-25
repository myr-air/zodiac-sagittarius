import Image from "next/image";
import type { ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import {
  getHighlightImage,
  highlightTone,
} from "@/src/features/itinerary/domain/overview";
import { formatOverviewStopSchedule } from "@/src/features/itinerary/domain/overview-stop-labels";
import {
  overviewBoardTitleClassName,
  overviewHighlightBoardClassName,
  overviewHighlightItemClassName,
  overviewHighlightListClassName,
  overviewHighlightToneClassNames,
  overviewMutedClassName,
} from "./overview.styles";

export interface HighlightBoardProps {
  items: ItineraryItem[];
  startDate: string;
  locale: Locale;
  emptyMessage: string;
  title: string;
  subtitle: string;
}

export function HighlightBoard({
  items,
  startDate,
  locale,
  emptyMessage,
  title,
  subtitle,
}: HighlightBoardProps) {
  if (items.length === 1) return null;

  return (
    <section className={overviewHighlightBoardClassName} aria-label={title}>
      <div className={overviewBoardTitleClassName}>
        <Icon name="location" />
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {items.length ? (
        <ul aria-label={title} className={overviewHighlightListClassName} tabIndex={0}>
          {items.map((item, index) => {
            const imgUrl = getHighlightImage(item);
            return (
              <li
                className={cn(
                  overviewHighlightItemClassName,
                  !imgUrl && overviewHighlightToneClassNames[highlightTone(item, index)],
                  imgUrl && "border-(--color-border-strong) bg-(--color-text) [&_small]:!text-white/84 [&_span]:!text-white/86 [&_strong]:!text-white",
                  "group cursor-pointer transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border)",
                )}
                key={item.id}
              >
                {imgUrl && (
                  <>
                    <Image
                      src={imgUrl}
                      alt={item.activity}
                      fill
                      sizes="(max-width: 767px) 240px, 25vw"
                      className="absolute inset-0 h-full w-full object-cover opacity-78 transition-transform duration-500 group-hover:scale-105 max-[767px]:opacity-70"
                      priority={index === 0}
                      loading={index === 0 ? "eager" : undefined}
                    />
                    <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgb(15_23_42_/_0.04),rgb(15_23_42_/_0.72))] max-[767px]:bg-[linear-gradient(180deg,rgb(15_23_42_/_0.06),rgb(15_23_42_/_0.36)_38%,rgb(15_23_42_/_0.88))]" />
                  </>
                )}
                <span className={cn("relative z-10 mb-1 text-[11px] font-bold uppercase tracking-normal", imgUrl ? "text-white/86 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.5)]" : "text-(--overview-highlight-accent)")}>
                  {formatOverviewStopSchedule(item, startDate, locale)}
                </span>
                <strong className={cn("relative z-10 mb-0.5 text-sm font-black leading-snug [overflow-wrap:anywhere]", imgUrl ? "text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_0.6)]" : "text-(--color-text)")}>
                  {item.activity}
                </strong>
                <small className={cn("relative z-10 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold", imgUrl ? "text-white/84 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.5)]" : "text-(--color-text-muted)")}>
                  {item.place}
                </small>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={overviewMutedClassName}>{emptyMessage}</p>
      )}
    </section>
  );
}
