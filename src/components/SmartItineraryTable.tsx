import type { ItineraryItem, TripRole, ValidationWarning } from "@/src/trip/types";
import { formatDayLabel, groupItemsByDay, validateItineraryItem } from "@/src/trip/itinerary";
import { Badge, Button } from "./ui";
import { Icon } from "./icons";

interface SmartItineraryTableProps {
  items: ItineraryItem[];
  role: TripRole;
  startDate: string;
  selectedItemId: string;
  onSelectItem: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
}

export function SmartItineraryTable({ items, role, startDate, selectedItemId, onSelectItem, onDuplicateItem }: SmartItineraryTableProps) {
  const groups = groupItemsByDay(items);
  const canEdit = role === "owner" || role === "organizer";

  return (
    <section className="table-panel" aria-labelledby="smart-itinerary-heading" aria-label="Smart itinerary table" id="table">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Source of truth</span>
          <h2 id="smart-itinerary-heading">Smart Itinerary Table</h2>
          <p>Every route view, suggestion, warning, and trip-mode preview is derived from these rows.</p>
        </div>
        <Badge tone={canEdit ? "success" : "neutral"}>{canEdit ? "Editable" : "Read-only"}</Badge>
      </div>

      <div className="table-scroll" tabIndex={0} aria-label="Scrollable itinerary rows">
        <table className="smart-table">
          <caption className="sr-only">Trip itinerary rows grouped by day.</caption>
          <thead>
            <tr>
              <th>Time</th>
              <th>Stop</th>
              <th>Type</th>
              <th>Route</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <DayGroup
                canEdit={canEdit}
                group={group}
                key={group.day}
                selectedItemId={selectedItemId}
                startDate={startDate}
                onDuplicateItem={onDuplicateItem}
                onSelectItem={onSelectItem}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DayGroup({
  group,
  startDate,
  selectedItemId,
  canEdit,
  onSelectItem,
  onDuplicateItem,
}: {
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  startDate: string;
  selectedItemId: string;
  canEdit: boolean;
  onSelectItem: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
}) {
  return (
    <>
      <tr className="day-row">
        <th colSpan={7}>
          <div className="day-row-content">
            <span>{formatDayLabel(group.day, startDate)}</span>
            <span>{group.day}</span>
            <Badge tone={group.warningCount ? "warning" : "success"}>
              {group.warningCount ? `${group.warningCount} issues` : "Ready"}
            </Badge>
          </div>
        </th>
      </tr>
      {group.items.map((item) => {
        const warnings = validateItineraryItem(item, group.items);
        return (
          <tr className={selectedItemId === item.id ? "data-row data-row--selected" : "data-row"} key={item.id}>
            <td className="time-cell">{item.startTime || "Needs time"}</td>
            <td>
              <button
                type="button"
                className="row-select"
                aria-pressed={selectedItemId === item.id}
                aria-label={`Select stop ${item.activity}`}
                onClick={() => onSelectItem(item.id)}
              >
                <strong>{item.activity}</strong>
                <span>{item.place}</span>
              </button>
            </td>
            <td><Badge tone={activityTone(item.activityType)}>{item.activityType}</Badge></td>
            <td className="route-cell">{item.transportation || "Add transport"}</td>
            <td>{item.durationMinutes ? `${item.durationMinutes} min` : "Set duration"}</td>
            <td><WarningSummary warnings={warnings} /></td>
            <td>
              <Button type="button" variant="ghost" disabled={!canEdit} onClick={() => onDuplicateItem(item.id)}>
                Duplicate
              </Button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function WarningSummary({ warnings }: { warnings: ValidationWarning[] }) {
  if (warnings.length === 0) return <Badge tone="success">Ready</Badge>;
  return (
    <span className="warning-summary">
      <Icon name="warning" />
      <span>{warnings.length} issue{warnings.length === 1 ? "" : "s"}</span>
    </span>
  );
}

function activityTone(type: ItineraryItem["activityType"]): "neutral" | "primary" | "route" | "warning" | "success" {
  if (type === "travel") return "route";
  if (type === "food") return "primary";
  if (type === "stay") return "neutral";
  if (type === "shopping") return "warning";
  return "success";
}
