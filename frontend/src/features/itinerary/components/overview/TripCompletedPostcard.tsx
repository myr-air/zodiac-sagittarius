import type { Locale } from "@/src/i18n/types";
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
