import type { Member, PlanVariant, Trip } from "@/src/trip/types";
import { getTripDates } from "@/src/trip/itinerary";
import { Badge, Button } from "./ui";
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

  return (
    <header className="command-bar" aria-label="Trip command bar">
      <div className="command-title">
        <div className="meta-line">
          <span>{trip.destinationLabel}</span>
          <span aria-hidden="true">/</span>
          <span>{trip.startDate} to {trip.endDate}</span>
        </div>
        <h1>{trip.name}</h1>
        <div className="status-row">
          <Badge tone="success">Draft saved locally</Badge>
          <Badge tone="primary">{selectedPlan.name}</Badge>
          <Badge tone="route">{currentMember.role}</Badge>
        </div>
      </div>

      <div className="command-controls" role="group" aria-label="Planning controls">
        <label className="field">
          <span>Role preview</span>
          <select value={currentMemberId} onChange={(event) => onChangeMember(event.target.value)}>
            {trip.members.map((member) => (
              <option value={member.id} key={member.id}>{member.displayName} / {member.role}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Plan variant</span>
          <select value={selectedPlanVariantId} onChange={(event) => onChangePlan(event.target.value)}>
            {trip.planVariants.map((plan) => (
              <option value={plan.id} key={plan.id}>{plan.name} / {plan.kind}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Selected day</span>
          <select value={selectedDay} onChange={(event) => onChangeDay(event.target.value)}>
            {dates.map((date, index) => (
              <option value={date} key={date}>Day {index + 1} / {date}</option>
            ))}
          </select>
        </label>
        <Button type="button" onClick={onAddStop} disabled={!canEdit} className="add-stop-button">
          <Icon name="plus" />
          Add stop
        </Button>
      </div>

      {!canEdit ? (
        <p className="capability-note" role="status">
          You can view this plan, but editing requires organizer access.
        </p>
      ) : null}
    </header>
  );
}
