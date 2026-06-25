import type { Locale } from "@/src/i18n/types";
import { formatTripRange } from "@/src/shared/components/page-header";
import type { Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";

interface BookingsDocsHeaderProps {
  canEditBookings: boolean;
  copy: BookingCopy;
  locale: Locale;
  onAddBooking: () => void;
  recordCount: number;
  trip: Trip;
}

export function BookingsDocsHeader({
  canEditBookings,
  copy,
  locale,
  onAddBooking,
  recordCount,
  trip,
}: BookingsDocsHeaderProps) {
  return (
    <header className={bookingStyles.headerClassName}>
      <div className="grid min-w-0 gap-0.5">
        <h1 className="m-0 text-2xl font-black leading-8 text-(--color-text) max-[767px]:text-xl">
          {copy.title}
        </h1>
        <span className="truncate text-sm font-extrabold text-(--color-text-muted)">
          {trip.name}
        </span>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 max-[767px]:w-full max-[767px]:justify-start">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-(--color-text-muted)">
          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5">
            <Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}
          </span>
          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5">
            <Icon name="ticket" /> {copy.records(recordCount)}
          </span>
        </div>
        {canEditBookings ? (
        <div className={bookingStyles.headerAsideClassName}>
          <div className={bookingStyles.headerActionRowClassName}>
            <Button type="button" onClick={onAddBooking} aria-label={copy.addBooking}>
              <Icon name="plus" /> <span>{copy.addBooking}</span>
            </Button>
          </div>
        </div>
        ) : null}
      </div>
    </header>
  );
}
