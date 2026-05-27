import type { Member, Trip } from "@/src/trip/types";
import { Button } from "./ui";
import { Icon } from "./icons";

interface CommandBarProps {
  trip: Trip;
  currentMemberId: string;
  canEdit: boolean;
  canUndo: boolean;
  canRedo: boolean;
  contextRailOpen: boolean;
  onChangeMember: (memberId: string) => void;
  onAddStop: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleContextRail: () => void;
}

export function CommandBar({
  trip,
  currentMemberId,
  canEdit,
  canUndo,
  canRedo,
  contextRailOpen,
  onChangeMember,
  onAddStop,
  onUndo,
  onRedo,
  onToggleContextRail,
}: CommandBarProps) {
  const currentMember = trip.members.find((member) => member.id === currentMemberId) as Member;

  return (
    <header className="top-app-bar" aria-label="Trip command bar">
      <div className="trip-title-group">
        <h1>{trip.name}</h1>
        <button className="icon-button icon-button--plain" type="button" aria-label="Open trip menu">
          <Icon name="chevronRight" />
        </button>
        <div className="trip-meta">
          <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate)}</span>
          <span><Icon name="users" /> {trip.members.length - 1} คน</span>
        </div>
      </div>

      <div className="top-controls" role="group" aria-label="Planning controls">
        <div className="save-indicator" aria-label="Draft save state">
          <Icon name="cloud" />
          <span>บันทึกแล้ว 2 นาทีที่แล้ว</span>
        </div>

        <Button type="button" onClick={onAddStop} disabled={!canEdit} className="add-stop-button">
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
        <button className="icon-button" type="button" aria-label="More actions">
          <Icon name="dots" />
        </button>
      </div>

      <label className="sr-only">
        Role preview
        <select value={currentMember.id} onChange={(event) => onChangeMember(event.target.value)}>
          {trip.members.map((member) => (
            <option value={member.id} key={member.id}>{member.displayName} / {member.role}</option>
          ))}
        </select>
      </label>

      {!canEdit ? (
        <p className="capability-note" role="status">
          You can view this plan, but editing requires organizer access.
        </p>
      ) : null}
    </header>
  );
}

function formatTripRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return `${start.getDate()}–${end.getDate()} ${formatThaiMonth(end)} ${end.getFullYear()}`;
}

function formatThaiMonth(date: Date): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return months[date.getMonth()] ?? "";
}
