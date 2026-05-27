import type { ExpenseSummary, ItineraryItem, Member, Suggestion, Trip } from "@/src/trip/types";
import { Button } from "./ui";
import { Icon } from "./icons";
import { SuggestionPanel } from "./SuggestionPanel";
import { PeoplePanel } from "./PeoplePanel";

interface ContextRailProps {
  trip: Trip;
  selectedItem: ItineraryItem;
  currentMember: Member;
  suggestions: Suggestion[];
  expenseSummary: ExpenseSummary;
  canEdit: boolean;
  open: boolean;
  onEditSelected: () => void;
  onClose: () => void;
}

export function ContextRail({ trip, selectedItem, currentMember, suggestions, expenseSummary, canEdit, open, onEditSelected, onClose }: ContextRailProps) {
  const selectedEnd = formatEndTime(selectedItem.startTime, selectedItem.durationMinutes);
  const groupSpend = expenseSummary.groupSpend.toLocaleString("en-HK");
  const perPerson = Math.round(expenseSummary.groupSpend / Math.max(1, trip.members.length - 1)).toLocaleString("en-HK");

  return (
    <aside className={open ? "context-rail context-rail--open" : "context-rail context-rail--closed"} data-state={open ? "open" : "closed"} aria-hidden={!open} aria-label="Planning context">
      <div className="rail-inspector">
        <div className="inspector-title">
          <h2>{selectedItem.activity}</h2>
          <button type="button" aria-label="Close details" onClick={onClose}><Icon name="chevronRight" /></button>
        </div>

        <div className="inspector-tabs" role="tablist" aria-label="Stop detail tabs">
          <button type="button" role="tab" aria-selected="true">รายละเอียด</button>
          <button type="button" role="tab" aria-selected="false">โน้ต</button>
          <button type="button" role="tab" aria-selected="false">ไฟล์ (0)</button>
          <button type="button" role="tab" aria-selected="false">ประวัติ</button>
        </div>

        <section className="detail-section" aria-label="Selected stop detail">
          <p><Icon name="utensils" /> {activityTypeLabel(selectedItem.activityType)}</p>
          <p><Icon name="clock" /> {selectedItem.startTime} – {selectedEnd} ({formatDuration(selectedItem.durationMinutes)})</p>
          <p><Icon name="location" /> {selectedItem.address ?? selectedItem.place}</p>
          <a className="map-link" href={selectedItem.mapLink}>เปิดใน Google Maps</a>
          <div className="detail-map" aria-label="Map preview for selected stop">
            <span className="map-road map-road-1" />
            <span className="map-road map-road-2" />
            <span className="map-road map-road-3" />
            <span className="map-water" />
            <span className="map-poi map-poi-1">Austin</span>
            <span className="map-poi map-poi-2">Jordan</span>
            <span className="map-marker"><Icon name="location" /></span>
          </div>
          <Button type="button" variant="secondary" disabled={!canEdit} onClick={onEditSelected}>แก้ไขรายละเอียด</Button>
        </section>

        <SuggestionPanel suggestions={suggestions} members={trip.members} />

        <section className="detail-section conflict-section" aria-label="Plan conflicts">
          <h3>ความขัดแย้ง</h3>
          <div className="conflict-row">
            <span><Icon name="alertCircle" /> Victoria Peak อาจหนาแน่นช่วง 10:00–12:00</span>
            <Button type="button" variant="ghost">ปรับเวลาอัตโนมัติ</Button>
          </div>
        </section>

        <section className="detail-section expense-module" aria-label="Expense summary">
          <h3>สรุปค่าใช้จ่าย</h3>
          <div className="expense-grid">
            <span>ค่าใช้จ่ายต่อคน (โดยประมาณ)</span>
            <strong>HK${perPerson}</strong>
            <span>รวมสำหรับ {trip.members.length - 1} คน</span>
            <strong>HK${groupSpend}</strong>
          </div>
          <Button type="button" variant="secondary">เพิ่ม/แก้ไขค่าใช้จ่าย</Button>
        </section>

        <PeoplePanel members={trip.members.filter((member) => member.id !== "member-viewer")} currentMemberId={currentMember.id} />
      </div>
    </aside>
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
  if (minutes % 60 === 0) return `${minutes / 60} ชม.`;
  return `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`;
}

function formatEndTime(startTime: string, minutes: number | null): string {
  if (!minutes || !startTime) return "—";
  const [hour = "0", minute = "0"] = startTime.split(":");
  const total = Number(hour) * 60 + Number(minute) + minutes;
  const endHour = Math.floor(total / 60) % 24;
  const endMinute = total % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}
