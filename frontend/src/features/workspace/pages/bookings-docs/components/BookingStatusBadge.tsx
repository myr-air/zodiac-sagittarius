import { cn } from "@/src/lib/cn";
import type { BookingDocStatus } from "@/src/trip/types";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import { badgeClassName } from "../BookingsDocsPage.styles";
import { statusBadgeClassName } from "../model/booking-display-visuals";
import { formatEnumLabel } from "../model/booking-options";

interface BookingStatusBadgeProps {
  className?: string;
  copy: BookingCopy;
  status: BookingDocStatus;
}

export function BookingStatusBadge({
  className,
  copy,
  status,
}: BookingStatusBadgeProps) {
  return (
    <span className={cn(badgeClassName, statusBadgeClassName(status), className)}>
      {formatEnumLabel(status, copy)}
    </span>
  );
}
