import { type FormEvent, useMemo, useState } from "react";
import type { ExpenseSummary, ItineraryItem, Member, StopNote, Suggestion, Trip, TripTask } from "@/src/trip/types";
import { Button } from "./ui";
import { Icon } from "./icons";
import { activityTypeLabel, formatDuration, formatEndTime } from "./itineraryDisplay";

interface ContextRailProps {
  trip: Trip;
  selectedItem: ItineraryItem;
  suggestions: Suggestion[];
  stopNotes: StopNote[];
  tasks: TripTask[];
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  canEdit: boolean;
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canEditExpenses: boolean;
  open: boolean;
  onCreateNote: (input: { itemId: string; body: string }) => void;
  onEditSelected: () => void;
  onReviewSuggestion: (suggestionId: string, decision: "approved" | "rejected") => void;
  onSuggestSelected: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onClose: () => void;
}

export function ContextRail({
  trip,
  selectedItem,
  suggestions,
  stopNotes,
  tasks,
  currentMember,
  expenseSummary,
  canEdit,
  canCreateSuggestion,
  canReviewSuggestions,
  canEditExpenses,
  open,
  onCreateNote,
  onEditSelected,
  onReviewSuggestion,
  onSuggestSelected,
  onToggleTaskStatus,
  onClose,
}: ContextRailProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "booking" | "suggestions">("notes");
  const [noteBody, setNoteBody] = useState("");
  const selectedEnd = formatEndTime(selectedItem.startTime, selectedItem.durationMinutes);
  const groupSpend = expenseSummary.groupSpend.toLocaleString("en-HK");
  const perPerson = Math.round(expenseSummary.groupSpend / Math.max(1, trip.members.length - 1)).toLocaleString("en-HK");
  const selectedNotes = useMemo(() => stopNotes.filter((note) => note.itemId === selectedItem.id), [selectedItem.id, stopNotes]);
  const selectedTasks = useMemo(() => tasks.filter((task) => task.relatedItemId === selectedItem.id || (task.kind === "booking" && task.title.toLowerCase().includes(selectedItem.activity.toLowerCase()))), [selectedItem, tasks]);
  const selectedSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.targetItemId === selectedItem.id && (suggestion.status === "pending" || suggestion.status === "conflicted")),
    [selectedItem.id, suggestions],
  );

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body) return;
    onCreateNote({ itemId: selectedItem.id, body });
    setNoteBody("");
  }

  return (
    <aside className={open ? "context-rail context-rail--open" : "context-rail context-rail--closed"} data-state={open ? "open" : "closed"} aria-hidden={!open} aria-label="Planning context">
      <div className="rail-inspector">
        <div className="inspector-title">
          <h2>{selectedItem.activity}</h2>
          <button type="button" aria-label="Close details" onClick={onClose}><Icon name="chevronRight" /></button>
        </div>

        <div className="inspector-tabs" role="tablist" aria-label="Stop detail tabs">
          <button type="button" role="tab" aria-selected={activeTab === "notes"} onClick={() => setActiveTab("notes")}>โน้ต</button>
          <button type="button" role="tab" aria-selected={activeTab === "booking"} onClick={() => setActiveTab("booking")}>การจอง</button>
          <button type="button" role="tab" aria-selected={activeTab === "suggestions"} onClick={() => setActiveTab("suggestions")}>ข้อเสนอ</button>
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
          {canEdit ? (
            <Button type="button" variant="secondary" onClick={onEditSelected}>แก้ไขรายละเอียด</Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={!canCreateSuggestion}
              onClick={() => {
                onSuggestSelected();
                setActiveTab("suggestions");
              }}
            >
              เสนอแก้ไข
            </Button>
          )}
        </section>

        {activeTab === "notes" ? (
          <section className="detail-section stop-notes-module" aria-label="Stop notes">
            <h3>โน้ตของจุดนี้</h3>
            <div className="stop-note-list">
              {selectedNotes.map((note) => {
                const author = trip.members.find((member) => member.id === note.authorId);
                return (
                  <article className="stop-note-item" key={note.id}>
                    <strong>{author?.displayName ?? "Traveler"}</strong>
                    <p>{note.body}</p>
                  </article>
                );
              })}
              {!selectedNotes.length ? <p className="empty-warning">ยังไม่มีโน้ตสำหรับจุดนี้</p> : null}
            </div>
            <form className="stop-note-form" onSubmit={submitNote}>
              <label>
                <span>เพิ่มโน้ตสำหรับจุดนี้</span>
                <textarea value={noteBody} disabled={!canCreateSuggestion && !canEdit} onChange={(event) => setNoteBody(event.target.value)} rows={3} />
              </label>
              <span className="stop-note-author">บันทึกในชื่อ {currentMember.displayName}</span>
              <Button type="submit" variant="secondary" disabled={!noteBody.trim() || (!canCreateSuggestion && !canEdit)}>บันทึกโน้ต</Button>
            </form>
          </section>
        ) : null}

        {activeTab === "booking" ? (
          <section className="detail-section stop-booking-module" aria-label="Booking and prep for this stop">
            <h3>การจองและของที่ต้องเตรียม</h3>
            <div className="booking-advisory-list">
              {(selectedItem.advisories ?? []).map((advisory) => (
                <span className={`booking-advisory booking-advisory--${advisory.severity}`} key={advisory.code}>
                  <Icon name="alertCircle" /> {advisory.label}
                </span>
              ))}
              {!selectedItem.advisories?.length ? <span className="empty-warning">ไม่มีคำเตือนการจองสำหรับจุดนี้</span> : null}
            </div>
            <ul className="stop-booking-task-list">
              {selectedTasks.map((task) => (
                <li className="stop-booking-task" data-status={task.status} key={task.id}>
                  <label>
                    <input type="checkbox" checked={task.status === "done"} disabled={!canEdit} onChange={() => onToggleTaskStatus(task.id)} />
                    <span>{task.title}</span>
                  </label>
                  <small>{task.kind === "booking" ? "การจอง" : "เตรียมตัว"}</small>
                </li>
              ))}
              {!selectedTasks.length ? <li className="empty-warning">ยังไม่มี checklist ที่ผูกกับจุดนี้</li> : null}
            </ul>
          </section>
        ) : null}

        {activeTab === "suggestions" ? (
          <section className="detail-section suggestion-module" aria-label="Suggestion review">
            <div className="module-title-row">
              <h3>คำแนะนำ ({selectedSuggestions.length})</h3>
              <span>{canReviewSuggestions ? "รอตัดสินใจ" : "อ่านอย่างเดียว"}</span>
            </div>
            <div className="suggestion-list">
              {selectedSuggestions.map((suggestion) => {
                const proposer = trip.members.find((member) => member.id === suggestion.proposerId);
                const label = suggestionLabel(suggestion);
                return (
                  <article className={`suggestion-item suggestion-item--${suggestion.status}`} key={suggestion.id}>
                    <Icon name={suggestion.status === "conflicted" ? "alertCircle" : "check"} />
                    <div>
                      <strong>{label}</strong>
                      <span>{proposer?.displayName ?? "Traveler"} suggested an update</span>
                      {canReviewSuggestions ? (
                        <div className="suggestion-actions">
                          <button type="button" onClick={() => onReviewSuggestion(suggestion.id, "approved")}>อนุมัติ {label}</button>
                          <button type="button" onClick={() => onReviewSuggestion(suggestion.id, "rejected")}>ปฏิเสธ {label}</button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {!selectedSuggestions.length ? <p className="empty-warning">ไม่มีข้อเสนอที่รอพิจารณาสำหรับจุดนี้</p> : null}
            </div>
          </section>
        ) : null}

        <section className="detail-section conflict-section" aria-label="Plan conflicts">
          <h3>ความขัดแย้ง</h3>
          <div className="conflict-row">
            <span><Icon name="alertCircle" /> Victoria Peak อาจหนาแน่นช่วง 10:00–12:00</span>
            <Button type="button" variant="ghost" disabled={!canReviewSuggestions}>ปรับเวลาอัตโนมัติ</Button>
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
          <Button type="button" variant="secondary" disabled={!canEditExpenses}>เพิ่ม/แก้ไขค่าใช้จ่าย</Button>
        </section>

      </div>
    </aside>
  );
}

function suggestionLabel(suggestion: Suggestion): string {
  return (
    suggestion.proposedPatch.activity ??
    suggestion.proposedPatch.note ??
    suggestion.proposedPatch.place ??
    suggestion.proposedPatch.transportation ??
    "แนะนำให้ปรับแผน"
  );
}
