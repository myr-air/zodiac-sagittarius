import { useState, type DragEvent } from "react";
import type { ItineraryAdvisory, ItineraryItem, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
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
  const { locale, t } = useI18n();
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
    <section className="table-panel" aria-label={t.itinerary.pageLabel} id="itinerary">
      <PageHeader
        title={t.itinerary.title}
        subtitle={tripName}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}</span>
            <span><Icon name="route" /> {t.itinerary.dayItems({ days: groups.length, stops: items.length })}</span>
            <span><Icon name="warning" /> {t.dates.warningCount({ count: warningCount })}</span>
            <span><Icon name="clock" /> {formatDuration(totalMinutes, locale)} {t.dates.planned}</span>
          </>
        )}
        aside={(
          <div className="page-header-actions" role="group" aria-label={t.itinerary.actionsLabel}>
            <Button type="button" onClick={onAddStop} disabled={!canRestructureItems} className="add-stop-button">
              <Icon name="plus" />
              {t.itinerary.addStop}
            </Button>
            <button
              className="icon-button details-toggle-button"
              type="button"
              aria-expanded={contextRailOpen}
              aria-label={contextRailOpen ? t.itinerary.hideDetails : t.itinerary.openDetails}
              onClick={onToggleContextRail}
              title={contextRailOpen ? t.itinerary.hideDetails : t.itinerary.openDetails}
            >
              <Icon name="panel" />
            </button>
            <button className="icon-button" type="button" aria-label={t.itinerary.undo} disabled={!canUndo} onClick={onUndo}>
              <Icon name="undo" />
            </button>
            <button className="icon-button" type="button" aria-label={t.itinerary.redo} disabled={!canRedo} onClick={onRedo}>
              <Icon name="redo" />
            </button>
            {!canEdit ? <p className="page-header-note">{t.itinerary.editRequiresOrganizer}</p> : null}
          </div>
        )}
      />
      <div className="table-scroll" tabIndex={0} aria-label={t.itinerary.scrollLabel}>
        <table className="smart-table">
          <caption className="sr-only">{t.itinerary.caption}</caption>
          <thead>
            <tr>
              <th>
                <span className="sr-only">{t.itinerary.headers.reorder}</span>
              </th>
              <th>{t.itinerary.headers.time}</th>
              <th>{t.itinerary.headers.activity}</th>
              <th>{t.itinerary.headers.type}</th>
              <th>{t.itinerary.headers.map}</th>
              <th>{t.itinerary.headers.duration}</th>
              <th>{t.itinerary.headers.transport}</th>
              <th>{t.itinerary.headers.warnings}</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <DayGroup
              canEdit={canRestructureItems}
              collapsed={collapsedDays.includes(group.day)}
              dragState={dragState}
              group={group}
              itineraryLabels={t.itinerary}
              locale={locale}
              key={group.day}
              selectedItemId={selectedItemId}
              startDate={startDate}
              onClearDragPreview={clearDragPreview}
              onDropItem={dropItem}
              onMoveItem={onMoveItem}
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
  itineraryLabels,
  locale,
  startDate,
  selectedItemId,
  canEdit,
  collapsed,
  dragState,
  onClearDragPreview,
  onDropItem,
  onMoveItem,
  onPreviewDrop,
  onSelectItem,
  onStartDrag,
  onToggleDay,
}: {
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  startDate: string;
  selectedItemId: string;
  canEdit: boolean;
  collapsed: boolean;
  dragState: { draggedItemId: string | null; overItemId: string | null };
  onClearDragPreview: () => void;
  onDropItem: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onPreviewDrop: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onStartDrag: (event: DragEvent<HTMLButtonElement>, itemId: string) => void;
  onToggleDay: (day: string) => void;
}) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);

  return (
    <tbody className="day-group" data-state={collapsed ? "closed" : "open"}>
      <tr className="day-row">
        <th colSpan={8}>
          <button
            type="button"
            className="day-row-content day-toggle"
            aria-expanded={!collapsed}
            aria-label={collapsed ? itineraryLabels.dayToggle.expand({ day: dayLabel }) : itineraryLabels.dayToggle.collapse({ day: dayLabel })}
            onClick={() => onToggleDay(group.day)}
          >
            <Icon name="chevronRight" />
            <strong>{dayLabel}</strong>
            <span>·</span>
            <span>{formatThaiDate(group.day, locale)}</span>
            <span className="day-route">{dayRouteLabel(group.day, locale)}</span>
          </button>
        </th>
      </tr>
      {group.items.map((item, itemIndex) => (
        <tr
          aria-hidden={collapsed}
          aria-label={itineraryLabels.row.openDetails({ activity: item.activity })}
          className={getRowClassName(item, selectedItemId, dragState)}
          key={item.id}
          onDragOver={(event) => onPreviewDrop(event, item.id)}
          onDrop={(event) => onDropItem(event, item.id)}
        >
          <td className="drag-cell">
            <div className="reorder-controls">
              <button
                type="button"
                className="drag-handle"
                draggable={canEdit && !collapsed}
                disabled={!canEdit}
                tabIndex={collapsed ? -1 : undefined}
                aria-label={itineraryLabels.row.drag({ activity: item.activity })}
                onDragEnd={onClearDragPreview}
                onDragStart={(event) => onStartDrag(event, item.id)}
              >
                <Icon name="drag" />
              </button>
              <button
                type="button"
                className="reorder-button"
                disabled={!canEdit || itemIndex === 0}
                tabIndex={collapsed ? -1 : undefined}
                aria-label={itineraryLabels.row.moveUp({ activity: item.activity })}
                onClick={() => {
                  const previousItem = group.items[itemIndex - 1];
                  if (previousItem) onMoveItem(item.id, previousItem.id);
                }}
              >
                <Icon name="chevronLeft" />
              </button>
              <button
                type="button"
                className="reorder-button"
                disabled={!canEdit || itemIndex >= group.items.length - 1}
                tabIndex={collapsed ? -1 : undefined}
                aria-label={itineraryLabels.row.moveDown({ activity: item.activity })}
                onClick={() => {
                  const nextItem = group.items[itemIndex + 1];
                  if (nextItem) onMoveItem(nextItem.id, item.id);
                }}
              >
                <Icon name="chevronRight" />
              </button>
            </div>
          </td>
          <td className="time-cell">{tableStartTime(item)}</td>
          <td className="activity-cell">
            <button
              type="button"
              className="row-select"
              aria-pressed={selectedItemId === item.id}
              aria-label={itineraryLabels.row.select({ activity: item.activity })}
              tabIndex={collapsed ? -1 : undefined}
              onClick={() => onSelectItem(item.id)}
              onDragOver={(event) => onPreviewDrop(event, item.id)}
              onDrop={(event) => onDropItem(event, item.id)}
            >
              <strong>{item.activity}</strong>
              <span>{item.place}</span>
            </button>
          </td>
          <td>{activityTypeLabel(item.activityType, locale)}</td>
          <td><a href={mapHref(item)} tabIndex={collapsed ? -1 : undefined}>{mapLinkLabel(item, itineraryLabels.row.mapFallback)}</a></td>
          <td>{formatDuration(item.durationMinutes, locale)}</td>
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

function AdvisorySummary({ advisories }: { advisories: ItineraryAdvisory[] }) {
  if (advisories.length === 0) return <span className="empty-warning">—</span>;
  return (
    <span className="warning-summary">
      <Icon name="warning" />
      <span>{advisories[0]?.label}</span>
    </span>
  );
}

function tableStartTime(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.startTime || "—";
}

function mapHref(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.mapLink || "#";
}

function mapLinkLabel(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.linkLabel || fallback;
}
