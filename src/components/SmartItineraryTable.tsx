import type { ItineraryAdvisory, ItineraryItem, TripRole } from "@/src/trip/types";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary";
import { Button } from "./ui";
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
    <section className="table-panel" aria-labelledby="smart-itinerary-heading" aria-label="Smart itinerary table" id="itinerary">
      <div className="view-tabs" role="tablist" aria-label="Planning views">
        <button type="button" role="tab" aria-selected="true" id="smart-itinerary-heading">Smart Itinerary Table</button>
        <button type="button" role="tab" aria-selected="false">ไทม์ไลน์</button>
        <button type="button" role="tab" aria-selected="false">ปรับเวลาอัตโนมัติ <span aria-hidden="true">✦</span></button>
      </div>

      <div className="table-scroll" tabIndex={0} aria-label="Scrollable itinerary rows">
        <table className="smart-table">
          <caption className="sr-only">Trip itinerary rows grouped by day.</caption>
          <thead>
            <tr>
              <th aria-label="จัดลำดับ" />
              <th>เวลา</th>
              <th>กิจกรรม / สถานที่</th>
              <th>ประเภท</th>
              <th>แผนที่ / ลิงก์</th>
              <th>ระยะเวลา</th>
              <th>การเดินทาง</th>
              <th>คำเตือน</th>
              <th aria-label="ตั้งค่าตาราง"><Icon name="settings" /></th>
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
        <th colSpan={9}>
          <div className="day-row-content">
            <Icon name="chevronRight" />
            <strong>{formatDayLabel(group.day, startDate)}</strong>
            <span>·</span>
            <span>{formatThaiDate(group.day)}</span>
            <span className="day-route">{dayRouteLabel(group.day)}</span>
          </div>
        </th>
      </tr>
      {group.items.map((item) => (
        <tr className={selectedItemId === item.id ? "data-row data-row--selected" : "data-row"} key={item.id}>
          <td className="drag-cell"><Icon name="drag" /></td>
          <td className="time-cell">{item.startTime || "—"}</td>
          <td className="activity-cell">
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
          <td>{activityTypeLabel(item.activityType)}</td>
          <td><a href={item.mapLink || "#"}>{item.linkLabel || "แผนที่"}</a></td>
          <td>{formatDuration(item.durationMinutes)}</td>
          <td>{item.transportation || "—"}</td>
          <td><AdvisorySummary advisories={item.advisories ?? []} /></td>
          <td className="row-actions">
            <Button
              type="button"
              variant="ghost"
              disabled={!canEdit}
              aria-label={`Duplicate ${item.activity}`}
              onClick={() => onDuplicateItem(item.id)}
            >
              <Icon name="copy" />
            </Button>
            <Icon name="drag" />
            <button type="button" className="row-more" aria-label={`More actions for ${item.activity}`}>
              <Icon name="dots" />
            </button>
          </td>
        </tr>
      ))}
      <tr className="add-row">
        <td />
        <td colSpan={8}>
          <button type="button"><Icon name="plus" /> เพิ่มกิจกรรม</button>
        </td>
      </tr>
    </>
  );
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

function activityTypeLabel(type: ItineraryItem["activityType"]): string {
  const labels: Record<ItineraryItem["activityType"], string> = {
    travel: "เดินทาง",
    food: "อาหาร",
    shopping: "ช้อปปิ้ง",
    attraction: "สถานที่",
    experience: "กิจกรรม",
    stay: "ที่พัก",
  };
  return labels[type];
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} นาที`;
  if (minutes % 60 === 0) return `${minutes / 60} ชม.`;
  return `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`;
}

function formatThaiDate(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  return `${date.getDate()} พ.ค. (${weekdays[date.getDay()]})`;
}

function dayRouteLabel(day: string): string {
  if (day === "2025-05-15") return "Bangkok → Hong Kong";
  if (day === "2025-05-16") return "Hong Kong City Day";
  if (day === "2025-05-17") return "Hong Kong → Shenzhen";
  return "Trip day";
}
