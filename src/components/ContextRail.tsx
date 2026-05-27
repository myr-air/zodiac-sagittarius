import type { ExpenseSummary, ItineraryItem, Member, Suggestion, Trip } from "@/src/trip/types";
import { getNowNext, validateItineraryItem } from "@/src/trip/itinerary";
import { Badge, Button, Panel } from "./ui";
import { Icon } from "./icons";
import { SuggestionPanel } from "./SuggestionPanel";
import { PeoplePanel } from "./PeoplePanel";

interface ContextRailProps {
  trip: Trip;
  items: ItineraryItem[];
  selectedItem: ItineraryItem;
  selectedDay: string;
  currentMember: Member;
  suggestions: Suggestion[];
  expenseSummary: ExpenseSummary;
  onSelectItem: (itemId: string) => void;
}

export function ContextRail({ trip, items, selectedItem, selectedDay, currentMember, suggestions, expenseSummary, onSelectItem }: ContextRailProps) {
  const dayItems = items.filter((item) => item.day === selectedItem.day);
  const warnings = validateItineraryItem(selectedItem, dayItems);
  const nowNext = getNowNext(items, selectedDay, "13:45");

  return (
    <aside className="context-rail" aria-label="Planning context">
      <Panel className="context-module selected-stop">
        <div className="module-title-row">
          <span className="section-kicker">Selected stop</span>
          <Badge tone={warnings.length ? "warning" : "success"}>{warnings.length ? `${warnings.length} issues` : "Ready"}</Badge>
        </div>
        <h2>{selectedItem.activity}</h2>
        <p className="muted">{selectedItem.place}</p>
        <dl className="detail-grid">
          <div><dt>Time</dt><dd>{selectedItem.startTime || "Needs time"}</dd></div>
          <div><dt>Duration</dt><dd>{selectedItem.durationMinutes ? `${selectedItem.durationMinutes} min` : "Unset"}</dd></div>
          <div><dt>Transport</dt><dd>{selectedItem.transportation || "Add transport"}</dd></div>
        </dl>
        <p className="note-box">{selectedItem.note || "No notes yet."}</p>
        {warnings.length ? (
          <ul className="warning-list">
            {warnings.map((warning) => <li key={warning.code}>{warning.message}</li>)}
          </ul>
        ) : null}
      </Panel>

      <Panel className="context-module map-module">
        <div className="module-title-row">
          <span className="section-kicker">Route preview</span>
          <Icon name="map" />
        </div>
        <div className="map-preview" aria-label="Simplified route preview">
          {items.slice(0, 6).map((item, index) => (
            <button
              className={item.id === selectedItem.id ? "map-pin map-pin--active" : "map-pin"}
              key={item.id}
              style={{ left: `${12 + index * 15}%`, top: `${index % 2 ? 58 : 34}%` }}
              type="button"
              aria-label={`Select map stop ${item.activity}`}
              onClick={() => onSelectItem(item.id)}
            >
              {index + 1}
            </button>
          ))}
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <path d="M12 34 C 25 60, 40 28, 55 58 S 78 32, 88 58" />
          </svg>
        </div>
        <div className="now-next">
          <span><Icon name="clock" /> Now</span>
          <strong>{nowNext.current?.activity ?? "No current stop"}</strong>
          <span>Next: {nowNext.next?.activity ?? nowNext.fallbackReason}</span>
        </div>
      </Panel>

      <SuggestionPanel suggestions={suggestions} members={trip.members} />

      <Panel className="context-module expense-module">
        <div className="module-title-row">
          <span className="section-kicker">Budget</span>
          <Icon name="wallet" />
        </div>
        <p className="metric">HK${expenseSummary.groupSpend.toLocaleString("en-HK")}</p>
        <p className="muted">{expenseSummary.currentUserNetLabel}</p>
        <Button type="button" variant="secondary">Open expense summary</Button>
      </Panel>

      <PeoplePanel members={trip.members} currentMemberId={currentMember.id} />
    </aside>
  );
}
