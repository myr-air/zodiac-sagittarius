import type { ItineraryItem } from "@/src/trip/types";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary";
import { Badge } from "./ui";
import { Icon } from "./icons";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatEndTime, formatThaiDate } from "./itineraryDisplay";

interface TimelineViewProps {
  items: ItineraryItem[];
  selectedItemId: string;
  startDate: string;
  onSelectItem: (itemId: string) => void;
}

export function TimelineView({ items, selectedItemId, startDate, onSelectItem }: TimelineViewProps) {
  const groups = groupItemsByDay(items);
  const warningCount = items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const totalMinutes = items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  const primaryRoute = groups.map((group) => dayRouteLabel(group.day)).join(" / ");

  return (
    <section className="timeline-panel timeline-panel--presentation" id="timeline" aria-labelledby="timeline-heading" aria-label="Trip timeline">
      <header className="surface-header">
        <div>
          <span className="section-kicker"><Icon name="list" /> ไทม์ไลน์</span>
          <h2 id="timeline-heading">Tour timeline</h2>
        </div>
        <div className="surface-metrics" aria-label="Timeline summary">
          <Badge tone="primary">{groups.length} days</Badge>
          <Badge tone="route">{items.length} stops</Badge>
          <Badge tone={warningCount ? "warning" : "success"}>{warningCount} warnings</Badge>
          <Badge tone="neutral">{formatDuration(totalMinutes)} planned</Badge>
        </div>
      </header>

      <div className="timeline-infographic-hero" aria-label="Timeline presentation summary">
        <div>
          <span className="timeline-deck-label">Customer handout</span>
          <h3>Hong Kong + Shenzhen at a glance</h3>
          <p>{primaryRoute}</p>
        </div>
        <div className="timeline-hero-stats">
          <span><strong>{groups.length}</strong> วัน</span>
          <span><strong>{items.length}</strong> stops</span>
          <span><strong>{formatDuration(totalMinutes)}</strong> planned</span>
        </div>
      </div>

      <div className="timeline-grid">
        {groups.map((group) => (
          <article className="timeline-day" key={group.day}>
            <header className="timeline-day-header">
              <div>
                <strong>{formatDayLabel(group.day, startDate)}</strong>
                <span>{formatThaiDate(group.day)}</span>
              </div>
              <Badge tone="route">{dayRouteLabel(group.day)}</Badge>
            </header>

            <ol className="timeline-stop-list">
              {group.items.map((item) => {
                const selected = item.id === selectedItemId;
                return (
                  <li className={selected ? "timeline-stop timeline-stop--selected" : "timeline-stop"} key={item.id}>
                    <button
                      type="button"
                      className="timeline-stop-button"
                      aria-label={`Select timeline stop ${item.activity}`}
                      aria-pressed={selected}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <span className="timeline-time">
                        <strong>{item.startTime || "—"}</strong>
                        <span>{formatEndTime(item.startTime, item.durationMinutes)}</span>
                      </span>
                      <span className="timeline-node" aria-hidden="true">
                        <Icon name={item.activityType === "travel" ? "route" : "location"} />
                      </span>
                      <span className="timeline-copy">
                        <strong>{item.activity}</strong>
                        <span>{item.place}</span>
                      </span>
                      <span className="timeline-meta">
                        <span>{activityTypeLabel(item.activityType)}</span>
                        <span>{formatDuration(item.durationMinutes)}</span>
                        {item.transportation ? <span>{item.transportation}</span> : null}
                      </span>
                      {item.advisories?.length ? (
                        <span className="timeline-warning">
                          <Icon name="warning" />
                          {item.advisories[0]?.label}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
