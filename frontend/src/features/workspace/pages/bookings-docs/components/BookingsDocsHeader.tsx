import type { Locale } from "@/src/i18n/types";
import type { Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import type { BookingCopy } from "../BookingsDocsPage.copy";
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
    <PageHeader
      title={copy.title}
      subtitle={trip.name}
      meta={(
        <>
          <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
          <span><Icon name="ticket" /> {copy.records(recordCount)}</span>
        </>
      )}
      aside={canEditBookings ? (
        <div className={bookingStyles.headerAsideClassName}>
          <div className={bookingStyles.headerActionRowClassName}>
            <Button type="button" onClick={onAddBooking} aria-label={copy.addBooking}>
              <Icon name="plus" /> <span>{copy.addBooking}</span>
            </Button>
          </div>
        </div>
      ) : null}
    />
  );
}
