import { cn } from "@/src/lib/cn";
import { readItineraryDetailString } from "@/src/trip/itinerary-items";
import {
  activityIdentityClassName,
  activityIdentityActivityClassName,
  activityIdentityAtGlyphClassName,
  activityIdentityPlaceClassName,
  activityPlaceInputClassName,
  activityRouteLabelClassName,
  activityRouteLineClassName,
  activityTitleInputClassName,
} from "../smart-itinerary-table.styles";
import { InlineActivityField } from "./InlineActivityField";
import type { ActivityCellProps } from "./activity-cell.types";

interface ActivityIdentityLineProps
  extends Pick<
    ActivityCellProps,
    "item" | "itineraryLabels" | "onUpdateItemInline"
  > {
  editable: boolean;
}

export function ActivityIdentityLine({
  editable,
  item,
  itineraryLabels,
  onUpdateItemInline,
}: ActivityIdentityLineProps) {
  if (item.activityType === "travel") {
    const from = readItineraryDetailString(item.details, "from");
    const to = readItineraryDetailString(item.details, "to") || item.place;
    return (
      <div className={cn(activityIdentityClassName, "min-w-0 flex-1 flex-col")}>
        <div className={activityIdentityActivityClassName}>
          <InlineActivityField
            ariaLabel={itineraryLabels.row.inlineActivity({
              activity: item.activity,
            })}
            autoSize
            className={activityTitleInputClassName}
            disabled={!editable}
            key={`${item.id}:activity:${item.activity}`}
            maxLength={90}
            placeholder="Activity"
            value={item.activity}
            onCommit={(activity) =>
              onUpdateItemInline?.(item.id, {
                activity: activity || item.activity,
              })
            }
          />
        </div>
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
          <span
            className={cn(
              activityRouteLabelClassName,
              "max-[520px]:col-start-1",
            )}
          >
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
        </div>
      </div>
    );
  }

  return (
    <div className={cn(activityIdentityClassName, "min-w-0 flex-1")}>
      <div className={activityIdentityActivityClassName}>
        <InlineActivityField
          ariaLabel={itineraryLabels.row.inlineActivity({
            activity: item.activity,
          })}
          autoSize
          className={activityTitleInputClassName}
          disabled={!editable}
          key={`${item.id}:activity:${item.activity}`}
          maxLength={90}
          placeholder="Activity"
          value={item.activity}
          onCommit={(activity) =>
            onUpdateItemInline?.(item.id, {
              activity: activity || item.activity,
            })
          }
        />
      </div>
      {item.place ? (
        <>
          <span className={activityIdentityAtGlyphClassName} aria-hidden="true">
            @
          </span>
          <div className={cn(activityIdentityPlaceClassName, "min-w-0 flex-1")}>
            <InlineActivityField
              ariaLabel={itineraryLabels.row.inlinePlace({
                activity: item.activity,
              })}
              autoSize
              className={cn(
                activityPlaceInputClassName,
                "max-[520px]:block",
              )}
              disabled={!editable}
              key={`${item.id}:place:${item.place}`}
              maxLength={90}
              placeholder=""
              value={item.place}
              onCommit={(place) =>
                onUpdateItemInline?.(item.id, { place })
              }
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
