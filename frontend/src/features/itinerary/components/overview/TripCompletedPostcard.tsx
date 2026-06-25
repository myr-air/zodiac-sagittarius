import type { Locale } from "@/src/i18n/types";
import { buildCompletedPostcardLabels } from "@/src/features/itinerary/domain/overview-completed-postcard";
import { getTripDates } from "@/src/trip/itinerary-core";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { tripCompletedClassName } from "./overview.styles";

export interface TripCompletedPostcardProps {
  trip: Trip;
  items: ItineraryItem[];
  groupSpendLabel: string;
  locale: Locale;
}

export function TripCompletedPostcard({
  trip,
  items,
  groupSpendLabel,
  locale,
}: TripCompletedPostcardProps) {
  const dayCount = getTripDates(trip.startDate, trip.endDate).length;
  const stopCount = items.length;
  const labels = buildCompletedPostcardLabels({
    dayCount,
    locale,
    stopCount,
    tripName: trip.name,
  });

  return (
    <div className={tripCompletedClassName}>
      <div className="absolute top-4 right-4 flex h-14 w-12 rotate-[6deg] select-none flex-col items-center justify-center rounded-(--radius-sm) border-2 border-dashed border-(--color-warning-border) opacity-70">
        <Icon name="location" className="size-5 text-(--color-warning-strong)" />
        <span className="mt-0.5 font-mono text-[7px] font-black uppercase tracking-normal text-(--color-warning-strong)">Joii Map</span>
      </div>

      <div className="flex max-w-[85%] flex-col gap-2.5">
        <strong className="flex items-center gap-1.5 text-base font-extrabold leading-tight text-(--color-text)">
          <Icon name="calendar" className="size-4.5 text-(--color-warning-strong)" />
          {labels.title}
        </strong>
        <p className="m-0 text-xs font-bold leading-relaxed text-(--color-text-muted)">
          {labels.message}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-(--color-warning-border) pt-4 text-center max-[480px]:grid-cols-1 max-[480px]:text-left">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{labels.durationLabel}</span>
          <strong className="text-lg font-black text-(--color-text)">{labels.durationValue}</strong>
        </div>
        <div className="flex flex-col gap-0.5 border-x border-(--color-warning-border) max-[480px]:border-x-0 max-[480px]:border-y max-[480px]:py-2">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{labels.stopsLabel}</span>
          <strong className="text-lg font-black text-(--color-text)">{labels.stopsValue}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{labels.budgetLabel}</span>
          <strong className="text-lg font-black text-(--color-text) [overflow-wrap:anywhere]">{groupSpendLabel}</strong>
        </div>
      </div>
    </div>
  );
}
