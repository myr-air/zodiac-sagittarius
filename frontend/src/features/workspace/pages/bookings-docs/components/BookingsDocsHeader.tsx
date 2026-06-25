import type { Locale } from "@/src/i18n/types";
import {
  PageHeader,
  PageHeaderMetaItem,
  PageHeaderTripDateMetaItem,
} from "@/src/shared/components/page-header";
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
    <PageHeader
      className="bookings-docs-header"
      variant="compact"
      title={copy.title}
      subtitle={trip.name}
      meta={(
        <>
          <PageHeaderTripDateMetaItem
            startDate={trip.startDate}
            endDate={trip.endDate}
            locale={locale}
          />
          <PageHeaderMetaItem icon="ticket">{copy.records(recordCount)}</PageHeaderMetaItem>
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
