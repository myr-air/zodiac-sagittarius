import type { ReactNode } from "react";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { BookingDoc, ItineraryItem, ItineraryItemStatus } from "@/src/trip/types";
import { Icon, type IconName } from "@/src/ui/icons";
import { formatDuration } from "../../../lib/itinerary-display";
import { ItineraryBookingButton } from "./ItineraryBookingButton";
import { ActivityMoreActionsButton } from "./ActivityCellControls";
import {
  activityActionClusterClassName,
  activityActionsClassName,
  activityMetaClassName,
  activityMetaStatusClassName,
  activityMobileLineClassName,
  activityMobileStatusClassName,
  activityPillClassName,
} from "../smart-itinerary-table.styles";
import type { ActivityCellProps } from "./activity-cell.types";

const STATUS_ICON_MAP: Record<
  ItineraryItemStatus,
  { icon: IconName; color: string }
> = {
  idea: { icon: "lightbulb", color: "size-3.5 text-(--color-text-subtle)" },
  planned: { icon: "circleDot", color: "size-3.5 text-(--color-route)" },
  booked: { icon: "ticket", color: "size-3.5 text-(--color-primary)" },
  confirmed: { icon: "badgeCheck", color: "size-3.5 text-(--color-primary)" },
  done: { icon: "checkCircle2", color: "size-3.5 text-(--color-success)" },
  skipped: { icon: "minusCircle", color: "size-3.5 text-(--color-text-subtle)" },
};

interface ActivityCellMetaProps {
  actionMenuLabel: string;
  actionsExpanded: boolean;
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onAddBookingForItem: ActivityCellProps["onAddBookingForItem"];
  onSaveBookingForItem: ActivityCellProps["onSaveBookingForItem"];
  onToggleActions: () => void;
  onUnlinkBookingForItem: ActivityCellProps["onUnlinkBookingForItem"];
  renderActivityActions: () => ReactNode;
  renderSubActivityButton: (compact?: boolean) => ReactNode;
  status: string | null;
}

export function ActivityCellMeta({
  actionMenuLabel,
  actionsExpanded,
  bookingDocs,
  bookingLinkItems,
  item,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onSaveBookingForItem,
  onToggleActions,
  onUnlinkBookingForItem,
  renderActivityActions,
  renderSubActivityButton,
  status,
}: ActivityCellMetaProps) {
  const statusIcon = item.status ? STATUS_ICON_MAP[item.status] : null;
  const statusLabel = status ?? "";
  const bookingButton = (
    <ItineraryBookingButton
      item={item}
      itineraryLabels={itineraryLabels}
      locale={locale}
      onAddBookingForItem={onAddBookingForItem}
      onSaveBookingForItem={onSaveBookingForItem}
      onUnlinkBookingForItem={onUnlinkBookingForItem}
      bookingDocs={bookingDocs}
      bookingLinkItems={bookingLinkItems}
    />
  );

  return (
    <>
      <div className={activityMobileLineClassName}>
        {status ? <span className={activityMobileStatusClassName}>{status}</span> : null}
        {bookingButton}
        <span className={activityActionClusterClassName}>
          {renderSubActivityButton(true)}
          <ActivityMoreActionsButton
            expanded={actionsExpanded}
            label={actionMenuLabel}
            onToggle={onToggleActions}
          />
        </span>
      </div>
      <div className={activityMetaClassName}>
        <div className={activityMetaStatusClassName}>
          {statusIcon ? (
            <span title={statusLabel}>
              <Icon name={statusIcon.icon} className={statusIcon.color} />
            </span>
          ) : null}
          {bookingButton}
          {item.durationMinutes ? (
            <span className={activityPillClassName}>
              <Icon name="clock" className="size-3.5" />
              {formatDuration(item.durationMinutes, locale)}
            </span>
          ) : null}
        </div>
        <div className={activityActionClusterClassName}>
          <span className={activityActionsClassName}>
            {renderActivityActions()}
          </span>
          {renderSubActivityButton()}
          <ActivityMoreActionsButton
            expanded={actionsExpanded}
            label={actionMenuLabel}
            onToggle={onToggleActions}
          />
        </div>
      </div>
    </>
  );
}
