import { formatDayLabel } from "@/src/trip/itinerary-core";
import { itineraryPathOptionsForDay, mainItineraryPathId } from "@/src/trip/itinerary-paths";
import { Icon } from "@/src/ui/icons";
import { formatThaiDate, dayRouteLabel } from "@/src/features/itinerary/lib";
import type { ReactNode } from "react";
import { DayPathControls } from "./day-path-controls";
import { DayTitleEditor } from "./day-title-editor";
import { DayWeatherChip } from "./day-weather-chip";
import {
  dayDateClassName,
  dayOrdinalClassName,
  dayRouteClassName,
  dayRowClassName,
  dayRowContentClassName,
  dayToggleClassName,
} from "./smart-itinerary-table.styles";
import type { DayGroupProps } from "./day-group.types";

interface DayGroupHeaderProps
  extends Pick<
    DayGroupProps,
    | "canEdit"
    | "collapsed"
    | "dailyBriefing"
    | "dayPathOverride"
    | "group"
    | "itineraryLabels"
    | "locale"
    | "onChangeDayPath"
    | "onClearDayPath"
    | "onSaveDayTitle"
    | "onToggleDay"
    | "pathOptions"
    | "showAllPaths"
    | "startDate"
  > {
  graphCell?: ReactNode;
  showGraph: boolean;
}

export function DayGroupHeader({
  canEdit,
  collapsed,
  dailyBriefing,
  dayPathOverride,
  group,
  graphCell,
  itineraryLabels,
  locale,
  onChangeDayPath,
  onClearDayPath,
  onSaveDayTitle,
  onToggleDay,
  pathOptions,
  showAllPaths,
  showGraph,
  startDate,
}: DayGroupHeaderProps) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);
  const dayA11yLabel = formatDayLabel(group.day, startDate, "en");
  const defaultDayTitle = dayRouteLabel(group.day, locale);
  const dayTitle = dailyBriefing?.manualOverrides.dayTitle?.trim() || defaultDayTitle;
  const dayPathOptions = itineraryPathOptionsForDay(pathOptions, group.day);
  const hasAlternativePathOptions = dayPathOptions.some(
    (option) => option.id !== mainItineraryPathId,
  );

  return (
    <tr className={dayRowClassName}>
      {graphCell}
      <th colSpan={showGraph ? 1 : 2}>
        <div className={dayRowContentClassName}>
          <button
            type="button"
            className={dayToggleClassName}
            aria-expanded={!collapsed}
            aria-label={
              collapsed
                ? itineraryLabels.dayToggle.expand({ day: dayLabel })
                : itineraryLabels.dayToggle.collapse({ day: dayLabel })
            }
            onClick={() => onToggleDay(group.day)}
          >
            <Icon name="chevronRight" />
            <strong className={dayOrdinalClassName}>{dayLabel}</strong>
          </button>
          <span className={dayDateClassName}>
            <span>·</span>
            <span>{formatThaiDate(group.day, locale)}</span>
          </span>
          <span className={dayRouteClassName}>
            <DayTitleEditor
              canEdit={canEdit && Boolean(dailyBriefing && onSaveDayTitle)}
              date={group.day}
              defaultTitle={defaultDayTitle}
              dayLabel={dayA11yLabel}
              key={`${group.day}:${dailyBriefing?.version ?? 1}:${dayTitle}`}
              title={dayTitle}
              version={dailyBriefing?.version ?? 1}
              onSaveDayTitle={onSaveDayTitle}
            />
          </span>
          <DayWeatherChip briefing={dailyBriefing} dayLabel={dayA11yLabel} />
          <DayPathControls
            day={group.day}
            dayLabel={dayA11yLabel}
            dayPathOptions={dayPathOptions}
            dayPathOverride={dayPathOverride}
            canEdit={canEdit}
            showAllPaths={showAllPaths}
            hasAlternativePathOptions={hasAlternativePathOptions}
            onChangeDayPath={onChangeDayPath}
            onClearDayPath={onClearDayPath}
          />
        </div>
      </th>
    </tr>
  );
}
