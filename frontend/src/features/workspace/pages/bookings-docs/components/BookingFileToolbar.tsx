import { InlineOptionPicker } from "@/src/shared/components/inline-option-picker";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import {
  bookingStatusFilterSelectOptions,
  type BookingStatusFilter,
} from "../model/booking-options";
import * as bookingStyles from "../BookingsDocsPage.styles";

interface BookingFileToolbarProps {
  copy: BookingCopy;
  query: string;
  statusFilter: BookingStatusFilter;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (status: BookingStatusFilter) => void;
}

export function BookingFileToolbar({
  copy,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
}: BookingFileToolbarProps) {
  const statusOptions = bookingStatusFilterSelectOptions(copy);
  const statusLabel =
    statusOptions.find((option) => option.value === statusFilter)?.label ??
    copy.allStatuses;

  return (
    <div className={bookingStyles.fileToolbarClassName}>
      <div className={bookingStyles.toolbarControlsClassName}>
        <label className="min-w-0">
          <span className="sr-only">{copy.searchPlaceholder}</span>
          <input
            className={bookingStyles.searchInputClassName}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            type="search"
          />
        </label>
        <InlineOptionPicker
          ariaLabel={`${copy.statusFilter}: ${statusLabel}`}
          buttonClassName={bookingStyles.statusFilterButtonClassName}
          onCommit={(value) => onStatusFilterChange(value as BookingStatusFilter)}
          optionKeyPrefix="booking-status-filter"
          options={statusOptions}
          value={statusFilter}
        />
      </div>
    </div>
  );
}
