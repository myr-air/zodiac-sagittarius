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

const suggestionListClassName = "suggestion-list grid gap-1.5";
const suggestionItemBaseClassName = "suggestion-item grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-xs leading-4 text-[#334155] [&_.icon]:size-4 [&>div]:grid [&>div]:gap-0.5 [&_strong]:font-semibold [&_span]:text-[var(--color-text-muted)]";
const suggestionItemToneClassNames = {
  conflicted: "suggestion-item--conflicted [&_.icon]:text-[var(--color-warning)]",
  pending: "suggestion-item--pending [&_.icon]:text-[var(--color-success)]",
} satisfies Record<"conflicted" | "pending", string>;
const suggestionActionsClassName = "suggestion-actions mt-1.5 flex flex-wrap gap-1.5";
const suggestionActionButtonClassName = "min-h-[26px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[11px] font-extrabold text-[var(--color-primary-strong)]";
const conflictRowClassName = "conflict-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 text-[11px] leading-4 text-[var(--color-warning-strong)]";
const conflictSummaryClassName = "inline-flex items-center gap-1.5 [&_.icon]:text-[var(--color-warning)]";
const moduleListClassName = "grid list-none gap-2 p-0 m-0";
const noteItemClassName = "stop-note-item grid gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2.5 py-[9px] [&>p]:m-0 [&>p]:text-[11px] [&>p]:font-bold [&>p]:leading-4 [&>p]:text-[var(--color-text-muted)] [&_strong]:text-xs [&_strong]:font-extrabold [&_strong]:leading-4 [&_strong]:text-[var(--color-text)]";
const noteHeaderClassName = "stop-note-header flex items-center justify-between gap-2";
const noteActionsClassName = "stop-note-actions inline-flex items-center gap-1.5";
const noteActionButtonClassName = "inline-grid size-7 cursor-pointer place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-strong)] focus-visible:border-[var(--color-primary)] focus-visible:text-[var(--color-primary-strong)] focus-visible:outline-none [&_.icon]:size-[15px]";
const noteEditFormClassName = "stop-note-edit-form grid gap-2";
const noteEditLabelClassName = "grid gap-1.5";
const noteEditTextareaClassName = "min-h-20 resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-[9px] text-[var(--color-text)]";
const noteEditActionsClassName = "stop-note-edit-actions inline-flex items-center gap-1.5";
const noteFormClassName = "stop-note-form grid gap-2";
const noteFormLabelClassName = "grid gap-[5px] [&>span]:text-[11px] [&>span]:font-black [&>span]:text-[var(--color-text-muted)]";
const noteFormTextareaClassName = "min-h-[70px] w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs leading-[17px] text-[var(--color-text)]";
const noteAuthorClassName = "stop-note-author m-0 text-[11px] font-bold leading-4 text-[var(--color-text-muted)]";
const bookingAdvisoryClassName = "booking-advisory inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-2 py-1 text-[11px] font-black text-[var(--color-warning-strong)] [&_.icon]:size-3.5";
const bookingTaskClassName = "stop-booking-task grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2.5 py-[9px] data-[status=done]:[&_span]:text-[var(--color-text-muted)] data-[status=done]:[&_span]:line-through";
const bookingTaskLabelClassName = "inline-flex min-w-0 items-center gap-2 [&_input]:size-[15px] [&_input]:accent-[var(--color-primary)] [&_span]:text-xs [&_span]:font-extrabold [&_span]:leading-4 [&_span]:text-[var(--color-text)]";
const bookingTaskMetaClassName = "text-[11px] font-bold leading-4 text-[var(--color-text-muted)]";
const expenseGridClassName = "expense-grid grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 text-xs [&_span]:text-[var(--color-text-muted)] [&_strong]:text-base [&_strong]:font-bold [&_strong]:leading-[21px] [&_strong]:tabular-nums";
const contextRailClassName =
  "context-rail absolute right-0 top-0 z-[3] h-full min-h-0 w-[380px] max-w-[min(380px,calc(100%_-_24px))] min-w-0 translate-x-0 bg-[var(--color-surface)] opacity-100 shadow-[-28px_0_54px_rgb(15_23_42_/_0.18)] [transition:transform_220ms_ease,opacity_180ms_ease,box-shadow_220ms_ease] will-change-[transform,opacity] data-[state=closed]:pointer-events-none data-[state=closed]:translate-x-6 data-[state=closed]:opacity-0 data-[state=closed]:shadow-[-8px_0_18px_rgb(15_23_42_/_0)] max-[1199px]:static max-[1199px]:w-full max-[1199px]:max-w-none max-[1199px]:shadow-none";
const contextRailOpenClassName = "context-rail--open animate-[drawer-slide-in_220ms_ease-out_both]";
const contextRailClosedClassName = "context-rail--closed";
const railInspectorClassName = "rail-inspector h-full min-h-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] max-[1199px]:min-h-0 max-[1199px]:border-l-0 max-[1199px]:border-t";
const inspectorTitleClassName = "inspector-title grid min-h-[50px] grid-cols-[minmax(0,1fr)_30px] items-center gap-3 px-3.5 pl-4";
const inspectorTitleHeadingClassName = "m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-extrabold leading-[22px] text-[#0f172a]";
const inspectorCloseButtonClassName = "grid size-[30px] place-items-center border-0 bg-transparent text-[#0f172a] [&_.icon]:rotate-180";
const inspectorTabsClassName = "inspector-tabs flex h-9 gap-6 border-y border-[var(--color-border)] px-4 max-[767px]:gap-[18px] max-[767px]:overflow-x-auto";
const inspectorTabClassName = "border-0 border-b-2 border-transparent bg-transparent text-xs font-bold text-[var(--color-text-muted)] aria-selected:border-[var(--color-primary)] aria-selected:text-[var(--color-primary-strong)]";
const mapLinkClassName = "map-link ml-[27px] text-xs font-semibold text-[#2563eb] no-underline";
const detailMapClassName = "detail-map relative min-h-[105px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[linear-gradient(90deg,rgb(203_213_225_/_0.7)_1px,transparent_1px),linear-gradient(0deg,rgb(203_213_225_/_0.7)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#e0f2fe)] bg-[length:37px_37px,37px_37px,auto]";
const mapRoadBaseClassName = "map-road absolute h-[5px] rounded-full bg-[#fca5a5] opacity-75 origin-left";
const mapRoadOneClassName = "map-road-1 left-[-15px] top-[74px] w-[230px] -rotate-[31deg]";
const mapRoadTwoClassName = "map-road-2 left-[18px] top-[18px] w-[210px] rotate-[8deg] bg-[#bfdbfe]";
const mapRoadThreeClassName = "map-road-3 left-[98px] top-[88px] w-[180px] -rotate-[8deg] bg-[#bae6fd]";
const mapWaterClassName = "map-water absolute right-0 bottom-0 h-[69px] w-[145px] rounded-tl-full bg-[rgb(125_211_252_/_0.28)]";
const mapPoiClassName = "map-poi absolute text-[11px] font-bold text-[#64748b]";
const mapMarkerClassName = "map-marker absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#ef4444] text-white shadow-[0_10px_20px_rgb(239_68_68_/_0.24)]";
const detailSectionClassName = "detail-section grid gap-1.5 border-b border-[var(--color-border)] px-4 py-2.5";
const detailHeadingClassName = "m-0 text-[13px] font-extrabold leading-[18px] text-[#334155]";
const detailMetaLineClassName = "m-0 inline-flex gap-[9px] text-xs leading-4 text-[#334155] [&_.icon]:text-[var(--color-text-muted)]";
const detailButtonClassName = "min-h-8 py-[5px]";
const emptyWarningClassName = "empty-warning text-[var(--color-text-subtle)]";

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
    <aside className={`${contextRailClassName} ${open ? contextRailOpenClassName : contextRailClosedClassName}`} data-state={open ? "open" : "closed"} aria-hidden={!open} aria-label={t.contextRail.pageLabel}>
      <div className={railInspectorClassName}>
        <div className={inspectorTitleClassName}>
          <h2 className={inspectorTitleHeadingClassName}>{selectedItem.activity}</h2>
          <button className={inspectorCloseButtonClassName} type="button" aria-label={t.contextRail.closeDetails} onClick={onClose}><Icon name="chevronRight" /></button>
        </div>

        <div className={inspectorTabsClassName} role="tablist" aria-label={t.contextRail.tabsLabel}>
          <button className={inspectorTabClassName} type="button" role="tab" aria-selected={activeTab === "notes"} onClick={() => setActiveTab("notes")}>{t.contextRail.tabs.notes}</button>
          <button className={inspectorTabClassName} type="button" role="tab" aria-selected={activeTab === "booking"} onClick={() => setActiveTab("booking")}>{t.contextRail.tabs.booking}</button>
          <button className={inspectorTabClassName} type="button" role="tab" aria-selected={activeTab === "suggestions"} onClick={() => setActiveTab("suggestions")}>{t.contextRail.tabs.suggestions}</button>
        </div>

        <section className={detailSectionClassName} aria-label={t.contextRail.detailLabel}>
          <p className={detailMetaLineClassName}><Icon name="utensils" /> {activityTypeLabel(selectedItem.activityType, locale)}</p>
          <p className={detailMetaLineClassName}><Icon name="clock" /> {selectedItem.startTime} – {selectedEnd} ({formatDuration(selectedItem.durationMinutes, locale)})</p>
          <p className={detailMetaLineClassName}><Icon name="location" /> {selectedItem.address ?? selectedItem.place}</p>
          <a className={mapLinkClassName} href={selectedItem.mapLink}>{t.contextRail.openMaps}</a>
          <div className={detailMapClassName} aria-label={t.contextRail.mapPreview}>
            <span className={`${mapRoadBaseClassName} ${mapRoadOneClassName}`} />
            <span className={`${mapRoadBaseClassName} ${mapRoadTwoClassName}`} />
            <span className={`${mapRoadBaseClassName} ${mapRoadThreeClassName}`} />
            <span className={mapWaterClassName} />
            <span className={`${mapPoiClassName} map-poi-1 left-[58px] top-[18px]`}>Austin</span>
            <span className={`${mapPoiClassName} map-poi-2 right-10 top-5`}>Jordan</span>
            <span className={mapMarkerClassName}><Icon name="location" /></span>
          </div>
          {canEdit ? (
            <Button type="button" variant="secondary" className={detailButtonClassName} onClick={onEditSelected}>{t.contextRail.editDetails}</Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className={detailButtonClassName}
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
          <section className={`${detailSectionClassName} stop-notes-module`} aria-label={t.contextRail.notes.label}>
            <h3 className={detailHeadingClassName}>{t.contextRail.notes.title}</h3>
            <div className={`stop-note-list ${moduleListClassName}`}>
              {selectedNotes.map((note) => {
                const author = trip.members.find((member) => member.id === note.authorId);
                const canManageNote = canEdit || note.authorId === currentMember.id;
                return (
                  <article className={noteItemClassName} key={note.id}>
                    <div className={noteHeaderClassName}>
                      <strong>{memberDisplayName(author, t.appShell.roles.traveler)}</strong>
                      {canManageNote ? (
                        <span className={noteActionsClassName}>
                          <button className={noteActionButtonClassName} type="button" aria-label={t.contextRail.notes.editBy({ name: memberDisplayName(author, t.appShell.roles.traveler) })} onClick={() => startEditingNote(note)}>
                            <Icon name="edit" />
                          </button>
                          <button className={noteActionButtonClassName} type="button" aria-label={t.contextRail.notes.deleteBy({ name: memberDisplayName(author, t.appShell.roles.traveler) })} onClick={() => onDeleteNote(note.id)}>
                            <Icon name="trash" />
                          </button>
                        </span>
                      ) : null}
                    </div>
                    {editingNoteId === note.id ? (
                      <form className={noteEditFormClassName} onSubmit={submitNoteEdit}>
                        <label className={noteEditLabelClassName}>
                          <span>{t.contextRail.notes.editNote}</span>
                          <textarea className={noteEditTextareaClassName} value={editingNoteBody} onChange={(event) => setEditingNoteBody(event.target.value)} rows={3} />
                        </label>
                        <div className={noteEditActionsClassName}>
                          <Button type="button" variant="ghost" className={detailButtonClassName} onClick={() => setEditingNoteId(null)}>{t.common.actions.cancel}</Button>
                          <Button type="submit" variant="secondary" className={detailButtonClassName} disabled={!editingNoteBody.trim()}>{t.contextRail.notes.saveEdit}</Button>
                        </div>
                      </form>
                    ) : (
                      <p>{note.body}</p>
                    )}
                  </article>
                );
              })}
              {!selectedNotes.length ? <p className={emptyWarningClassName}>{t.contextRail.notes.empty}</p> : null}
            </div>
            <form className={noteFormClassName} onSubmit={submitNote}>
              <label className={noteFormLabelClassName}>
                <span>{t.contextRail.notes.add}</span>
                <textarea className={noteFormTextareaClassName} value={noteBody} disabled={!canCreateNote} onChange={(event) => setNoteBody(event.target.value)} rows={3} />
              </label>
              <span className={noteAuthorClassName}>{t.contextRail.notes.savedAs({ name: currentMember.displayName })}</span>
              <Button type="submit" variant="secondary" className={detailButtonClassName} disabled={!canCreateNote || !noteBody.trim()}>{t.contextRail.notes.save}</Button>
            </form>
          </section>
        ) : null}

        {activeTab === "booking" ? (
          <section className={`${detailSectionClassName} stop-booking-module`} aria-label={t.contextRail.booking.label}>
            <h3 className={detailHeadingClassName}>{t.contextRail.booking.title}</h3>
            <div className={`booking-advisory-list ${moduleListClassName}`}>
              {selectedAdvisories.map((advisory) => (
                <span className={`${bookingAdvisoryClassName} booking-advisory--${advisory.severity}`} key={advisory.code}>
                  <Icon name="alertCircle" /> {advisory.label}
                </span>
              ))}
              {!selectedItem.advisories?.length ? <span className={emptyWarningClassName}>{t.contextRail.booking.noWarnings}</span> : null}
            </div>
            <ul className={`stop-booking-task-list ${moduleListClassName}`}>
              {selectedTasks.map((task) => (
                <li className={bookingTaskClassName} data-status={task.status} key={task.id}>
                  <label className={bookingTaskLabelClassName}>
                    <input type="checkbox" checked={task.status === "done"} disabled={!canEdit} onChange={() => onToggleTaskStatus(task.id)} />
                    <span>{task.title}</span>
                  </label>
                  <small className={bookingTaskMetaClassName}>{taskKindLabel(task, t.contextRail.booking)}</small>
                </li>
              ))}
              {!selectedTasks.length ? <li className={emptyWarningClassName}>{t.contextRail.booking.noTasks}</li> : null}
            </ul>
          </section>
        ) : null}

        {activeTab === "suggestions" ? (
          <section className={`${detailSectionClassName} suggestion-module`} aria-label={t.contextRail.suggestions.label}>
            <div className="module-title-row flex items-center justify-between gap-2.5">
              <h3 className={detailHeadingClassName}>{t.contextRail.suggestions.title({ count: selectedSuggestions.length })}</h3>
              <span>{canReviewSuggestions ? t.contextRail.suggestions.pending : t.contextRail.suggestions.readOnly}</span>
            </div>
            <div className={suggestionListClassName}>
              {selectedSuggestions.map((suggestion) => {
                const proposer = trip.members.find((member) => member.id === suggestion.proposerId);
                const label = suggestionLabel(suggestion, t.contextRail.suggestions.fallback);
                return (
                  <article className={`${suggestionItemBaseClassName} ${suggestion.status === "conflicted" ? suggestionItemToneClassNames.conflicted : suggestionItemToneClassNames.pending}`} key={suggestion.id}>
                    <Icon name={suggestion.status === "conflicted" ? "alertCircle" : "check"} />
                    <div>
                      <strong>{label}</strong>
                      <span>{t.contextRail.suggestions.suggestedUpdate({ name: memberDisplayName(proposer, t.appShell.roles.traveler) })}</span>
                      {canReviewSuggestions ? (
                        <div className={suggestionActionsClassName}>
                          <button className={suggestionActionButtonClassName} type="button" onClick={() => onReviewSuggestion(suggestion.id, "approved")}>{t.contextRail.suggestions.approve({ label })}</button>
                          <button className={suggestionActionButtonClassName} type="button" onClick={() => onReviewSuggestion(suggestion.id, "rejected")}>{t.contextRail.suggestions.reject({ label })}</button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {!selectedSuggestions.length ? <p className={emptyWarningClassName}>{t.contextRail.suggestions.empty}</p> : null}
            </div>
          </section>
        ) : null}

        <section className={`${detailSectionClassName} conflict-section`} aria-label={t.contextRail.conflicts.label}>
          <h3 className={detailHeadingClassName}>{t.contextRail.conflicts.title}</h3>
          <div className={conflictRowClassName}>
            <span className={conflictSummaryClassName}><Icon name="alertCircle" /> {t.contextRail.conflicts.peakWarning}</span>
            <Button type="button" variant="ghost" className="min-h-7 px-2 py-1 text-[11px]" disabled={!canReviewSuggestions}>{t.contextRail.conflicts.autoFix}</Button>
          </div>
        </section>

        <section className={`${detailSectionClassName} expense-module`} aria-label={t.contextRail.expenses.label}>
          <h3 className={detailHeadingClassName}>{t.contextRail.expenses.title}</h3>
          <div className={expenseGridClassName}>
            <span>{t.contextRail.expenses.perPerson}</span>
            <strong>HK${perPerson}</strong>
            <span>{t.contextRail.expenses.totalFor({ count: trip.members.length - 1 })}</span>
            <strong>HK${groupSpend}</strong>
          </div>
          <Button type="button" variant="secondary" className={detailButtonClassName} disabled={!canEditExpenses}>{t.contextRail.expenses.edit}</Button>
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
