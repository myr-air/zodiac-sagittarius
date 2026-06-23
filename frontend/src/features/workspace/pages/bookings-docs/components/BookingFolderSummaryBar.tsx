import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";

interface BookingFolderSummaryBarProps {
  activeFolderDescription: string;
  activeFolderTitle: string;
  copy: BookingCopy;
  visibleCount: number;
}

export function BookingFolderSummaryBar({
  activeFolderDescription,
  activeFolderTitle,
  copy,
  visibleCount,
}: BookingFolderSummaryBarProps) {
  return (
    <div className={bookingStyles.activeFolderBarClassName} aria-label={copy.bookingSummary}>
      <div className="grid gap-0.5">
        <strong className="text-[15px] font-extrabold text-(--color-text)">{activeFolderTitle}</strong>
        <span className={bookingStyles.activeFolderDescriptionClassName}>
          {copy.visibleItems(activeFolderDescription, visibleCount)}
        </span>
      </div>
      <span className="text-xs font-black text-(--color-text-muted)">{copy.itemCount(visibleCount)}</span>
    </div>
  );
}
