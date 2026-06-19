import { InlineOptionPicker } from "../inline-option-picker";
import { mainItineraryPathId, type ItineraryPathOption } from "@/src/trip/itinerary";
import {
  dayClearPathButtonClassName,
  dayPathControlsClassName,
  dayPathPickerClassName,
} from "./smart-itinerary-table.styles";

interface DayPathControlsProps {
  day: string;
  dayLabel: string;
  dayPathOptions: ItineraryPathOption[];
  dayPathOverride?: string;
  canEdit: boolean;
  showAllPaths: boolean;
  hasAlternativePathOptions: boolean;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
}

export function DayPathControls({
  day,
  dayLabel,
  dayPathOptions,
  dayPathOverride,
  canEdit,
  showAllPaths,
  hasAlternativePathOptions,
  onChangeDayPath,
  onClearDayPath,
}: DayPathControlsProps) {
  if (!hasAlternativePathOptions) return null;

  return (
    <span className={dayPathControlsClassName}>
      <InlineOptionPicker
        buttonClassName={dayPathPickerClassName}
        ariaLabel={`Path for ${dayLabel}`}
        value={dayPathOverride ?? mainItineraryPathId}
        disabled={!canEdit || showAllPaths}
        options={dayPathOptions.map((option) => ({
          value: option.id,
          label: option.name,
        }))}
        onCommit={(pathId) => onChangeDayPath?.(day, pathId)}
      />
      <button
        type="button"
        className={dayClearPathButtonClassName}
        aria-label={`Clear path override for ${dayLabel}`}
        disabled={!canEdit || showAllPaths || !dayPathOverride}
        onClick={() => onClearDayPath?.(day)}
      >
        Clear
      </button>
    </span>
  );
}
