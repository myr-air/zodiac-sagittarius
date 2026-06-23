import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import { bookingStatusFilterValues, formatEnumLabel, type BookingStatusFilter } from "../model/booking-options";
import * as bookingStyles from "../BookingsDocsPage.styles";

interface BookingFileToolbarProps {
  copy: BookingCopy;
  query: string;
  statusFilter: BookingStatusFilter;
  statusMenuOpen: boolean;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (status: BookingStatusFilter) => void;
  onToggleStatusMenu: () => void;
}

export function BookingFileToolbar({
  copy,
  query,
  statusFilter,
  statusMenuOpen,
  onQueryChange,
  onStatusFilterChange,
  onToggleStatusMenu,
}: BookingFileToolbarProps) {
  const statusLabel = statusFilter === "all" ? copy.allStatuses : formatEnumLabel(statusFilter, copy);

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
        <div className={bookingStyles.statusFilterWrapClassName}>
          <button
            aria-controls="booking-status-filter-menu"
            aria-expanded={statusMenuOpen}
            aria-haspopup="listbox"
            aria-label={`${copy.statusFilter}: ${statusLabel}`}
            className={bookingStyles.statusFilterButtonClassName}
            onClick={onToggleStatusMenu}
            type="button"
          >
            <span className="truncate">{statusLabel}</span>
            <Icon name="chevronRight" className={cn("size-3.5 transition-transform", statusMenuOpen && "rotate-90")} />
          </button>
          {statusMenuOpen ? (
            <div className={bookingStyles.statusFilterMenuClassName} id="booking-status-filter-menu" role="listbox" aria-label={copy.statusFilter}>
              {bookingStatusFilterValues.map((status) => {
                const selected = statusFilter === status;
                return (
                  <button
                    aria-selected={selected}
                    className={cn(bookingStyles.statusFilterOptionClassName, selected && bookingStyles.statusFilterOptionActiveClassName)}
                    key={status}
                    onClick={() => onStatusFilterChange(status)}
                    role="option"
                    type="button"
                  >
                    <span>{selected ? <Icon name="check" className="size-3.5" /> : null}</span>
                    <span className="truncate">{status === "all" ? copy.allStatuses : formatEnumLabel(status, copy)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
