import type { Member, PlanVariant, Trip } from "@/src/trip/types";
import { getTripDates } from "@/src/trip/itinerary";
import { Button } from "./ui";
import { Icon } from "./icons";

interface CommandBarProps {
  trip: Trip;
  currentMemberId: string;
  selectedDay: string;
  selectedPlanVariantId: string;
  canEdit: boolean;
  onChangeMember: (memberId: string) => void;
  onChangeDay: (day: string) => void;
  onChangePlan: (planId: string) => void;
  onAddStop: () => void;
}

export function CommandBar({
  trip,
  currentMemberId,
  selectedDay,
  selectedPlanVariantId,
  canEdit,
  onChangeMember,
  onChangeDay,
  onChangePlan,
  onAddStop,
}: CommandBarProps) {
  const dates = getTripDates(trip.startDate, trip.endDate);
  const currentMember = trip.members.find((member) => member.id === currentMemberId) as Member;
  const selectedPlan = trip.planVariants.find((plan) => plan.id === selectedPlanVariantId) as PlanVariant;
  const selectedDayIndex = dates.indexOf(selectedDay);

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
        <span className="control-label">แผน</span>
        <label className="compact-select" aria-label="Plan variant">
          <span className="sr-only">Plan variant</span>
          <select value={selectedPlanVariantId} onChange={(event) => onChangePlan(event.target.value)}>
            {trip.planVariants.map((plan) => (
              <option value={plan.id} key={plan.id}>{plan.name}</option>
            ))}
          </select>
        </label>

        <span className="control-label">วัน</span>
        <div className="day-stepper">
          <button type="button" aria-label="Previous day" onClick={() => onChangeDay(dates[Math.max(0, selectedDayIndex - 1)] ?? selectedDay)}>
            <Icon name="chevronLeft" />
          </button>
          <label aria-label="Selected day">
            <span className="sr-only">Selected day</span>
            <select value={selectedDay} onChange={(event) => onChangeDay(event.target.value)}>
              {dates.map((date, index) => (
                <option value={date} key={date}>{formatDayOption(date, index)}</option>
              ))}
            </select>
          </label>
          <button type="button" aria-label="Next day" onClick={() => onChangeDay(dates[Math.min(dates.length - 1, selectedDayIndex + 1)] ?? selectedDay)}>
            <Icon name="chevronRight" />
          </button>
        </div>

        <div className="save-indicator" aria-label="Draft save state">
          <Icon name="cloud" />
          <span>บันทึกแล้ว 2 นาทีที่แล้ว</span>
        </div>

        <Button type="button" onClick={onAddStop} disabled={!canEdit} className="add-stop-button">
          <Icon name="plus" />
          เพิ่มสถานที่ / กิจกรรม
        </Button>

        <button className="icon-button" type="button" aria-label="Undo">
          <Icon name="undo" />
        </button>
        <button className="icon-button" type="button" aria-label="Redo">
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
      <span className="sr-only">Current plan: {selectedPlan.name}</span>
    </header>
  );
}

function formatTripRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return `${start.getDate()}–${end.getDate()} ${formatThaiMonth(end)} ${end.getFullYear()}`;
}

function formatDayOption(date: string, index: number): string {
  const current = new Date(`${date}T00:00:00`);
  const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  return `Day ${index + 1} · ${current.getDate()} ${formatThaiMonth(current)} (${weekdays[current.getDay()]})`;
}

function formatThaiMonth(date: Date): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return months[date.getMonth()] ?? "";
}
