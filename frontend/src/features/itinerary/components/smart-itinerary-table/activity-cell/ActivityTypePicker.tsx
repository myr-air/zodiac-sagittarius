import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type { InlineItineraryItemPatch } from "../../../lib/inline-itinerary-item-patch";
import type { ItineraryItem } from "@/src/trip/types";
import { InlineOptionPicker } from "@/src/shared/components/inline-option-picker";
import {
  activityTypeOptions,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
  travelSubtypeForItem,
  travelSubtypeOptions,
} from "@/src/features/itinerary/domain/itinerary-item-editing";

export function ActivityTypePicker({
  buttonClassName,
  disabled,
  item,
  itineraryLabels,
  locale,
  onUpdateItemInline,
}: {
  buttonClassName?: string;
  disabled?: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const subtype = travelSubtypeForItem(item);
  return (
    <InlineOptionPicker
      ariaLabel={itineraryLabels.row.inlineType({
        activity: item.activity,
      })}
      buttonClassName={buttonClassName}
      disabled={disabled}
      options={activityTypeOptions(locale)}
      optionKeyPrefix={`activity-type-${item.id}`}
      selectedSubValue={subtype ?? undefined}
      subOptionsByValue={{ travel: travelSubtypeOptions(locale) }}
      value={item.activityType}
      onCommit={(activityType: string) =>
        onUpdateItemInline?.(
          item.id,
          buildActivityTypePatch(item, activityType as ItineraryItem["activityType"]),
        )
      }
      onCommitSubOption={(
        activityType: string,
        mode: string,
      ) =>
        onUpdateItemInline?.(
          item.id,
          buildActivitySubtypePatch(
            item,
            activityType as ItineraryItem["activityType"],
            mode,
          ),
        )
      }
    />
  );
}
