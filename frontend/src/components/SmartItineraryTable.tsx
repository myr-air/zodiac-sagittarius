import { useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import type { ItineraryAdvisory, ItineraryItem, TripRole } from "@/src/trip/types";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary";
import { Button } from "./ui";
import { Icon } from "./icons";
import { formatTripRange, PageHeader } from "./PageHeader";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatThaiDate } from "./itineraryDisplay";

interface SmartItineraryTableProps {
  canRedo: boolean;
  canRestructure?: boolean;
  canUndo: boolean;
  contextRailOpen: boolean;
  endDate: string;
  items: ItineraryItem[];
  role: TripRole;
  startDate: string;
  selectedItemId: string;
  tripName: string;
  onAddStop: () => void;
  onSelectItem: (itemId: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onRedo: () => void;
  onToggleContextRail: () => void;
  onUndo: () => void;
}

export function SmartItineraryTable({
  canRedo,
  canRestructure = true,
  canUndo,
  contextRailOpen,
  endDate,
  items,
  role,
  startDate,
  selectedItemId,
  tripName,
  onAddStop,
  onSelectItem,
  onMoveItem,
  onRedo,
  onToggleContextRail,
  onUndo,
}: SmartItineraryTableProps) {
  const groups = groupItemsByDay(items);
  const canEdit = role === "owner" || role === "organizer";
  const canRestructureItems = canEdit && canRestructure;
  const warningCount = items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const totalMinutes = items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ draggedItemId: string | null; overItemId: string | null }>({ draggedItemId: null, overItemId: null });

  function toggleDay(day: string) {
    setCollapsedDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDragState({ draggedItemId: itemId, overItemId: null });
  }

  function previewDrop(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    const draggedItemId = dragState.draggedItemId ?? event.dataTransfer.getData("text/plain");
    if (!draggedItemId || draggedItemId === targetItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragState((current) => (current.overItemId === targetItemId ? current : { draggedItemId, overItemId: targetItemId }));
  }

  function dropItem(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData("text/plain");
    if (draggedItemId && draggedItemId !== targetItemId) onMoveItem(draggedItemId, targetItemId);
    clearDragPreview();
  }

  function clearDragPreview() {
    setDragState({ draggedItemId: null, overItemId: null });
  }

  return (
    <section className="table-panel" aria-label="Smart itinerary table" id="itinerary">
      <PageHeader
        title="แผนการเดินทาง"
        subtitle={tripName}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate)}</span>
            <span><Icon name="route" /> {groups.length} วัน / {items.length} stops</span>
            <span><Icon name="warning" /> {warningCount} warnings</span>
            <span><Icon name="clock" /> {formatDuration(totalMinutes)} planned</span>
          </>
        )}
        aside={(
          <div className="page-header-actions" role="group" aria-label="Itinerary actions">
            <Button type="button" onClick={onAddStop} disabled={!canRestructureItems} className="add-stop-button">
              <Icon name="plus" />
              เพิ่มสถานที่ / กิจกรรม
            </Button>
            <button
              className="icon-button details-toggle-button"
              type="button"
              aria-expanded={contextRailOpen}
              aria-label={contextRailOpen ? "Hide details panel" : "Open details"}
              onClick={onToggleContextRail}
              title={contextRailOpen ? "Hide details panel" : "Open details"}
            >
              <Icon name="panel" />
            </button>
            <button className="icon-button" type="button" aria-label="Undo" disabled={!canUndo} onClick={onUndo}>
              <Icon name="undo" />
            </button>
            <button className="icon-button" type="button" aria-label="Redo" disabled={!canRedo} onClick={onRedo}>
              <Icon name="redo" />
            </button>
            {!canEdit ? <p className="page-header-note">Editing requires organizer access.</p> : null}
          </div>
        )}
      />
      <div className="table-scroll" tabIndex={0} aria-label="Scrollable itinerary rows">
        <table className="smart-table">
          <caption className="sr-only">Trip itinerary rows grouped by day.</caption>
          <thead>
            <tr>
              <th>
                <span className="sr-only">จัดลำดับ</span>
              </th>
              <th>เวลา</th>
              <th>กิจกรรม / สถานที่</th>
              <th>ประเภท</th>
              <th>แผนที่ / ลิงก์</th>
              <th>ระยะเวลา</th>
              <th>การเดินทาง</th>
              <th>คำเตือน</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <DayGroup
              canEdit={canRestructureItems}
              collapsed={collapsedDays.includes(group.day)}
              dragState={dragState}
              group={group}
              key={group.day}
              selectedItemId={selectedItemId}
              startDate={startDate}
              onClearDragPreview={clearDragPreview}
              onDropItem={dropItem}
              onPreviewDrop={previewDrop}
              onSelectItem={onSelectItem}
              onStartDrag={startDrag}
              onToggleDay={toggleDay}
            />
          ))}
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
  collapsed,
  dragState,
  onClearDragPreview,
  onDropItem,
  onPreviewDrop,
  onSelectItem,
  onStartDrag,
  onToggleDay,
}: {
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  startDate: string;
  selectedItemId: string;
  canEdit: boolean;
  collapsed: boolean;
  dragState: { draggedItemId: string | null; overItemId: string | null };
  onClearDragPreview: () => void;
  onDropItem: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onPreviewDrop: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onStartDrag: (event: DragEvent<HTMLButtonElement>, itemId: string) => void;
  onToggleDay: (day: string) => void;
}) {
  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, itemId: string) {
    if (shouldIgnoreRowClick(event.target)) return;
    onSelectItem(itemId);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, itemId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (shouldIgnoreRowClick(event.target)) return;
    event.preventDefault();
    onSelectItem(itemId);
  }

  const dayLabel = formatDayLabel(group.day, startDate);

  return (
    <tbody className="day-group" data-state={collapsed ? "closed" : "open"}>
      <tr className="day-row">
        <th colSpan={8}>
          <button
            type="button"
            className="day-row-content day-toggle"
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? "Expand" : "Collapse"} ${dayLabel}`}
            onClick={() => onToggleDay(group.day)}
          >
            <Icon name="chevronRight" />
            <strong>{dayLabel}</strong>
            <span>·</span>
            <span>{formatThaiDate(group.day)}</span>
            <span className="day-route">{dayRouteLabel(group.day)}</span>
          </button>
        </th>
      </tr>
      {group.items.map((item) => (
        <tr
          aria-hidden={collapsed}
          aria-label={`Open details for ${item.activity}`}
          className={getRowClassName(item, selectedItemId, dragState)}
          key={item.id}
          tabIndex={collapsed ? -1 : 0}
          onClick={(event) => handleRowClick(event, item.id)}
          onDragOver={(event) => onPreviewDrop(event, item.id)}
          onDrop={(event) => onDropItem(event, item.id)}
          onKeyDown={(event) => handleRowKeyDown(event, item.id)}
        >
          <td className="drag-cell">
            <button
              type="button"
              className="drag-handle"
              draggable={canEdit && !collapsed}
              disabled={!canEdit}
              tabIndex={collapsed ? -1 : undefined}
              aria-label={`Drag ${item.activity}`}
              onDragEnd={onClearDragPreview}
              onDragStart={(event) => onStartDrag(event, item.id)}
            >
              <Icon name="drag" />
            </button>
          </td>
          <td className="time-cell">{item.startTime || "—"}</td>
          <td className="activity-cell">
            <button
              type="button"
              className="row-select"
              aria-pressed={selectedItemId === item.id}
              aria-label={`Select stop ${item.activity}`}
              tabIndex={collapsed ? -1 : undefined}
              onClick={() => onSelectItem(item.id)}
              onDragOver={(event) => onPreviewDrop(event, item.id)}
              onDrop={(event) => onDropItem(event, item.id)}
            >
              <strong>{item.activity}</strong>
              <span>{item.place}</span>
            </button>
          </td>
          <td>{activityTypeLabel(item.activityType)}</td>
          <td><a href={item.mapLink || "#"} tabIndex={collapsed ? -1 : undefined}>{item.linkLabel || "แผนที่"}</a></td>
          <td>{formatDuration(item.durationMinutes)}</td>
          <td>{item.transportation || "—"}</td>
          <td><AdvisorySummary advisories={item.advisories ?? []} /></td>
        </tr>
      ))}
    </tbody>
  );
}

function getRowClassName(
  item: ItineraryItem,
  selectedItemId: string,
  dragState: { draggedItemId: string | null; overItemId: string | null },
): string {
  return [
    "data-row",
    selectedItemId === item.id ? "data-row--selected" : null,
    dragState.draggedItemId === item.id ? "data-row--dragging" : null,
    dragState.overItemId === item.id ? "data-row--drop-target" : null,
  ].filter(Boolean).join(" ");
}

function shouldIgnoreRowClick(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("a, button"));
}

function AdvisorySummary({ advisories }: { advisories: ItineraryAdvisory[] }) {
  if (advisories.length === 0) return <span className="empty-warning">—</span>;
  return (
    <span className="warning-summary">
      <Icon name="warning" />
      <span>{advisories[0]?.label}</span>
    </span>
  );
}
