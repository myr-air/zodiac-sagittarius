import { Icon } from "@/src/ui/icons";
import {
  activityTabletActionsClassName,
  subActivityToggleButtonClassName,
} from "../../smart-itinerary-table.styles";

export function ActivitySubActivityToggle({
  activity,
  expanded,
  onOpenCompact,
  onToggleExpanded,
}: {
  activity: string;
  expanded: boolean;
  onOpenCompact: () => void;
  onToggleExpanded: () => void;
}) {
  const label = `Sub-activities for ${activity}`;
  return (
    <button
      type="button"
      className={subActivityToggleButtonClassName}
      aria-label={label}
      aria-expanded={expanded}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        if (isCompactActivityCell()) {
          onOpenCompact();
          return;
        }
        onToggleExpanded();
      }}
    >
      <Icon name="list" />
    </button>
  );
}

export function ActivityMoreActionsButton({
  expanded,
  label,
  onToggle,
}: {
  expanded: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={activityTabletActionsClassName}
      aria-label={label}
      aria-expanded={expanded}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <Icon name="dots" />
    </button>
  );
}

function isCompactActivityCell(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 640px)").matches
  );
}
