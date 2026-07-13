import { cn } from "@/src/lib/cn";
import type { Messages } from "@/src/i18n/messages";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import type { ItineraryItem } from "@/src/trip/types";
import { readItineraryDetailString } from "@/src/trip/itinerary-items";
import { InlineActivityField } from "./InlineActivityField";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import { Icon } from "@/src/ui/icons";
import {
  activityMobilePlaceInputClassName,
  activityPlaceInputClassName,
  activityPlaceLineClassName,
  activityRouteLabelClassName,
  activityRouteLineClassName,
  activityTransportLineClassName,
} from "../smart-itinerary-table.styles";

export function ActivityLocationLine({
  editable,
  item,
  itineraryLabels,
  onUpdateItemInline,
}: {
  editable: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => ItineraryAsyncVoidResult;
}) {
  if (item.activityType === "travel") {
    const from = readItineraryDetailString(item.details, "from");
    const to = readItineraryDetailString(item.details, "to") || item.place;
    return (
      <div className={activityRouteLineClassName}>
        <span className={activityRouteLabelClassName}>From</span>
        <InlineActivityField
          ariaLabel={`Edit origin ${item.activity}`}
          autoSize
          className={activityPlaceInputClassName}
          disabled={!editable}
          key={`${item.id}:from:${from}`}
          maxLength={90}
          placeholder=""
          value={from}
          onCommit={(nextFrom) =>
            onUpdateItemInline?.(item.id, {
              details: {
                ...(item.details ?? {}),
                from: nextFrom,
              },
            })
          }
        />
        <span className={cn(activityRouteLabelClassName, "max-[520px]:col-start-1")}>
          To
        </span>
        <InlineActivityField
          ariaLabel={itineraryLabels.row.inlinePlace({
            activity: item.activity,
          })}
          autoSize
          className={activityPlaceInputClassName}
          disabled={!editable}
          key={`${item.id}:to:${to}`}
          maxLength={90}
          placeholder=""
          value={to}
          onCommit={(nextTo) =>
            onUpdateItemInline?.(item.id, {
              place: nextTo,
              details: {
                ...(item.details ?? {}),
                to: nextTo,
              },
            })
          }
        />
        <div className={activityTransportLineClassName} aria-hidden="true" />
      </div>
    );
  }

  return (
    <>
      <div className={activityPlaceLineClassName}>
        <span className={activityRouteLabelClassName}>Place</span>
        <InlineActivityField
          ariaLabel={itineraryLabels.row.inlinePlace({
            activity: item.activity,
          })}
          className={cn(activityMobilePlaceInputClassName, "max-[520px]:block")}
          disabled={!editable}
          key={`${item.id}:place:${item.place}`}
          maxLength={90}
          placeholder=""
          value={item.place}
          onCommit={(place) => onUpdateItemInline?.(item.id, { place })}
        />
      </div>
      <div className={activityTransportLineClassName}>
        <Icon name="route" />
        <span>{item.transportation}</span>
      </div>
    </>
  );
}
