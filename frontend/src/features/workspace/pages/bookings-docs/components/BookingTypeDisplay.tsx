import { cn } from "@/src/lib/cn";
import type { BookingDocType } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import { bookingTypeIcon, typeIconClassName } from "../model/booking-display-visuals";
import { formatEnumLabel } from "../model/booking-options";

interface BookingTypeDisplayProps {
  className?: string;
  copy: BookingCopy;
  type: BookingDocType;
}

export function BookingTypeMark({ className, type }: Omit<BookingTypeDisplayProps, "copy">) {
  return (
    <span
      className={cn(
        "grid size-8 place-items-center rounded-(--radius-sm) border",
        typeIconClassName(type),
        className,
      )}
    >
      <Icon name={bookingTypeIcon(type)} />
    </span>
  );
}

export function BookingTypeLabel({ className, copy, type }: BookingTypeDisplayProps) {
  const label = formatEnumLabel(type, copy);

  if (!className) return <>{label}</>;

  return <span className={className}>{label}</span>;
}
