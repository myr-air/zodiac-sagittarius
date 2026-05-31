import { type FormEvent, useMemo, useState } from "react";
import type { ExpenseSummary, ItineraryItem, Member, StopNote, Suggestion, Trip, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
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
  canCreateNote: boolean;
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canEditExpenses: boolean;
  open: boolean;
  onCreateNote: (input: { itemId: string; body: string }) => void;
  onDeleteNote: (noteId: string) => void;
  onEditSelected: () => void;
  onReviewSuggestion: (suggestionId: string, decision: "approved" | "rejected") => void;
  onSuggestSelected: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onUpdateNote: (input: { noteId: string; body: string }) => void;
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
  canCreateNote,
  canCreateSuggestion,
  canReviewSuggestions,
  canEditExpenses,
  open,
  onCreateNote,
  onDeleteNote,
  onEditSelected,
  onReviewSuggestion,
  onSuggestSelected,
  onToggleTaskStatus,
  onUpdateNote,
  onClose,
}: ContextRailProps) {
  const { locale, t } = useI18n();
  const [activeTab, setActiveTab] = useState<"notes" | "booking" | "suggestions">("notes");
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const selectedEnd = formatEndTime(selectedItem.startTime, selectedItem.durationMinutes);
  const groupSpend = expenseSummary.groupSpend.toLocaleString("en-HK");
  const perPerson = Math.round(expenseSummary.groupSpend / Math.max(1, trip.members.length - 1)).toLocaleString("en-HK");
  /* v8 ignore next */
  const selectedAdvisories = selectedItem.advisories ?? [];
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

  function startEditingNote(note: StopNote) {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body);
  }

  function submitNoteEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = editingNoteBody.trim();
    if (!editingNoteId || !body) return;
    onUpdateNote({ noteId: editingNoteId, body });
    setEditingNoteId(null);
    setEditingNoteBody("");
  }

  return (
    <aside className={open ? "context-rail context-rail--open" : "context-rail context-rail--closed"} data-state={open ? "open" : "closed"} aria-hidden={!open} aria-label={t.contextRail.pageLabel}>
      <div className="rail-inspector">
        <div className="inspector-title">
          <h2>{selectedItem.activity}</h2>
          <button type="button" aria-label={t.contextRail.closeDetails} onClick={onClose}><Icon name="chevronRight" /></button>
        </div>

        <div className="inspector-tabs" role="tablist" aria-label={t.contextRail.tabsLabel}>
          <button type="button" role="tab" aria-selected={activeTab === "notes"} onClick={() => setActiveTab("notes")}>{t.contextRail.tabs.notes}</button>
          <button type="button" role="tab" aria-selected={activeTab === "booking"} onClick={() => setActiveTab("booking")}>{t.contextRail.tabs.booking}</button>
          <button type="button" role="tab" aria-selected={activeTab === "suggestions"} onClick={() => setActiveTab("suggestions")}>{t.contextRail.tabs.suggestions}</button>
        </div>

        <section className="detail-section" aria-label={t.contextRail.detailLabel}>
          <p><Icon name="utensils" /> {activityTypeLabel(selectedItem.activityType, locale)}</p>
          <p><Icon name="clock" /> {selectedItem.startTime} – {selectedEnd} ({formatDuration(selectedItem.durationMinutes, locale)})</p>
          <p><Icon name="location" /> {selectedItem.address ?? selectedItem.place}</p>
          <a className="map-link" href={selectedItem.mapLink}>{t.contextRail.openMaps}</a>
          <div className="detail-map" aria-label={t.contextRail.mapPreview}>
            <span className="map-road map-road-1" />
            <span className="map-road map-road-2" />
            <span className="map-road map-road-3" />
            <span className="map-water" />
            <span className="map-poi map-poi-1">Austin</span>
            <span className="map-poi map-poi-2">Jordan</span>
            <span className="map-marker"><Icon name="location" /></span>
          </div>
          {canEdit ? (
            <Button type="button" variant="secondary" onClick={onEditSelected}>{t.contextRail.editDetails}</Button>
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
              {t.contextRail.suggestEdit}
            </Button>
          )}
        </section>

        {activeTab === "notes" ? (
          <section className="detail-section stop-notes-module" aria-label={t.contextRail.notes.label}>
            <h3>{t.contextRail.notes.title}</h3>
            <div className="stop-note-list">
              {selectedNotes.map((note) => {
                const author = trip.members.find((member) => member.id === note.authorId);
                const canManageNote = canEdit || note.authorId === currentMember.id;
                return (
                  <article className="stop-note-item" key={note.id}>
                    <div className="stop-note-header">
                      <strong>{memberDisplayName(author, t.appShell.roles.traveler)}</strong>
                      {canManageNote ? (
                        <span className="stop-note-actions">
                          <button type="button" aria-label={t.contextRail.notes.editBy({ name: memberDisplayName(author, t.appShell.roles.traveler) })} onClick={() => startEditingNote(note)}>
                            <Icon name="edit" />
                          </button>
                          <button type="button" aria-label={t.contextRail.notes.deleteBy({ name: memberDisplayName(author, t.appShell.roles.traveler) })} onClick={() => onDeleteNote(note.id)}>
                            <Icon name="trash" />
                          </button>
                        </span>
                      ) : null}
                    </div>
                    {editingNoteId === note.id ? (
                      <form className="stop-note-edit-form" onSubmit={submitNoteEdit}>
                        <label>
                          <span>{t.contextRail.notes.editNote}</span>
                          <textarea value={editingNoteBody} onChange={(event) => setEditingNoteBody(event.target.value)} rows={3} />
                        </label>
                        <div className="stop-note-edit-actions">
                          <Button type="button" variant="ghost" onClick={() => setEditingNoteId(null)}>{t.common.actions.cancel}</Button>
                          <Button type="submit" variant="secondary" disabled={!editingNoteBody.trim()}>{t.contextRail.notes.saveEdit}</Button>
                        </div>
                      </form>
                    ) : (
                      <p>{note.body}</p>
                    )}
                  </article>
                );
              })}
              {!selectedNotes.length ? <p className="empty-warning">{t.contextRail.notes.empty}</p> : null}
            </div>
            <form className="stop-note-form" onSubmit={submitNote}>
              <label>
                <span>{t.contextRail.notes.add}</span>
                <textarea value={noteBody} disabled={!canCreateNote} onChange={(event) => setNoteBody(event.target.value)} rows={3} />
              </label>
              <span className="stop-note-author">{t.contextRail.notes.savedAs({ name: currentMember.displayName })}</span>
              <Button type="submit" variant="secondary" disabled={!canCreateNote || !noteBody.trim()}>{t.contextRail.notes.save}</Button>
            </form>
          </section>
        ) : null}

        {activeTab === "booking" ? (
          <section className="detail-section stop-booking-module" aria-label={t.contextRail.booking.label}>
            <h3>{t.contextRail.booking.title}</h3>
            <div className="booking-advisory-list">
              {selectedAdvisories.map((advisory) => (
                <span className={`booking-advisory booking-advisory--${advisory.severity}`} key={advisory.code}>
                  <Icon name="alertCircle" /> {advisory.label}
                </span>
              ))}
              {!selectedItem.advisories?.length ? <span className="empty-warning">{t.contextRail.booking.noWarnings}</span> : null}
            </div>
            <ul className="stop-booking-task-list">
              {selectedTasks.map((task) => (
                <li className="stop-booking-task" data-status={task.status} key={task.id}>
                  <label>
                    <input type="checkbox" checked={task.status === "done"} disabled={!canEdit} onChange={() => onToggleTaskStatus(task.id)} />
                    <span>{task.title}</span>
                  </label>
                  <small>{taskKindLabel(task, t.contextRail.booking)}</small>
                </li>
              ))}
              {!selectedTasks.length ? <li className="empty-warning">{t.contextRail.booking.noTasks}</li> : null}
            </ul>
          </section>
        ) : null}

        {activeTab === "suggestions" ? (
          <section className="detail-section suggestion-module" aria-label={t.contextRail.suggestions.label}>
            <div className="module-title-row">
              <h3>{t.contextRail.suggestions.title({ count: selectedSuggestions.length })}</h3>
              <span>{canReviewSuggestions ? t.contextRail.suggestions.pending : t.contextRail.suggestions.readOnly}</span>
            </div>
            <div className="suggestion-list">
              {selectedSuggestions.map((suggestion) => {
                const proposer = trip.members.find((member) => member.id === suggestion.proposerId);
                const label = suggestionLabel(suggestion, t.contextRail.suggestions.fallback);
                return (
                  <article className={`suggestion-item suggestion-item--${suggestion.status}`} key={suggestion.id}>
                    <Icon name={suggestion.status === "conflicted" ? "alertCircle" : "check"} />
                    <div>
                      <strong>{label}</strong>
                      <span>{t.contextRail.suggestions.suggestedUpdate({ name: memberDisplayName(proposer, t.appShell.roles.traveler) })}</span>
                      {canReviewSuggestions ? (
                        <div className="suggestion-actions">
                          <button type="button" onClick={() => onReviewSuggestion(suggestion.id, "approved")}>{t.contextRail.suggestions.approve({ label })}</button>
                          <button type="button" onClick={() => onReviewSuggestion(suggestion.id, "rejected")}>{t.contextRail.suggestions.reject({ label })}</button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {!selectedSuggestions.length ? <p className="empty-warning">{t.contextRail.suggestions.empty}</p> : null}
            </div>
          </section>
        ) : null}

        <section className="detail-section conflict-section" aria-label={t.contextRail.conflicts.label}>
          <h3>{t.contextRail.conflicts.title}</h3>
          <div className="conflict-row">
            <span><Icon name="alertCircle" /> {t.contextRail.conflicts.peakWarning}</span>
            <Button type="button" variant="ghost" disabled={!canReviewSuggestions}>{t.contextRail.conflicts.autoFix}</Button>
          </div>
        </section>

        <section className="detail-section expense-module" aria-label={t.contextRail.expenses.label}>
          <h3>{t.contextRail.expenses.title}</h3>
          <div className="expense-grid">
            <span>{t.contextRail.expenses.perPerson}</span>
            <strong>HK${perPerson}</strong>
            <span>{t.contextRail.expenses.totalFor({ count: trip.members.length - 1 })}</span>
            <strong>HK${groupSpend}</strong>
          </div>
          <Button type="button" variant="secondary" disabled={!canEditExpenses}>{t.contextRail.expenses.edit}</Button>
        </section>

      </div>
    </aside>
  );
}

function suggestionLabel(suggestion: Suggestion, fallback: string): string {
  /* v8 ignore next */
  return (
    suggestion.proposedPatch.activity ??
    suggestion.proposedPatch.note ??
    suggestion.proposedPatch.place ??
    suggestion.proposedPatch.transportation ??
    fallback
  );
}

function memberDisplayName(member: Member | undefined, fallback: string): string {
  /* v8 ignore next */
  return member?.displayName ?? fallback;
}

function taskKindLabel(task: TripTask, labels: { booking: string; prep: string }): string {
  /* v8 ignore next */
  return task.kind === "booking" ? labels.booking : labels.prep;
}
