import Image from "next/image";
import type { ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import {
  getHighlightImage,
  highlightTone,
} from "@/src/features/itinerary/domain/overview";
import { formatOverviewStopSchedule } from "./overview-stop-labels";
import {
  overviewBoardTitleClassName,
  overviewHighlightBoardClassName,
  overviewHighlightItemClassName,
  overviewHighlightListClassName,
  overviewHighlightToneClassNames,
  overviewMutedClassName,
} from "./overview.styles";

export function HighlightBoard({
  items,
  startDate,
  locale,
  emptyMessage,
  title,
  subtitle,
}: {
  items: ItineraryItem[];
  startDate: string;
  locale: Locale;
  emptyMessage: string;
  title: string;
  subtitle: string;
}) {
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
                  imgUrl && "border-(--color-border-strong) bg-(--color-text)",
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
                      className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-108"
                      priority={index === 0}
                      loading={index === 0 ? "eager" : undefined}
                    />
                    <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgb(15_23_42_/_0.12),rgb(15_23_42_/_0.82))]" />
                  </>
                )}
                <span className={cn("relative z-10 mb-1 text-[11px] font-bold uppercase tracking-normal", imgUrl ? "text-white/82" : "text-(--overview-highlight-accent)")}>
                  {formatOverviewStopSchedule(item, startDate, locale)}
                </span>
                <strong className={cn("relative z-10 mb-0.5 text-sm font-black leading-snug [overflow-wrap:anywhere]", imgUrl ? "text-white" : "text-(--color-text)")}>
                  {item.activity}
                </strong>
                <small className={cn("relative z-10 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold", imgUrl ? "text-white/78" : "text-(--color-text-muted)")}>
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
