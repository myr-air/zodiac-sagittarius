import { type FormEvent, useEffect, useMemo, useState } from "react";
import type {
  BookingDoc,
  BookingDocType,
  Expense,
  ExpenseSummary,
  ItineraryItem,
  Member,
  StopNote,
  Suggestion,
  Trip,
  TripTask,
} from "@/src/trip/types";
import { safeExternalHref } from "@/src/trip/safe-links";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { activityTypeLabel, formatDuration, formatEndTime } from "@/src/features/itinerary/lib";
import {
  bookingDocTypeOptions,
  ContextRailTab,
  formatBookingDocTypeLabel,
  memberDisplayName,
  suggestionLabel,
  taskKindLabel,
} from "./context-rail.utils";
import {
  bookingAdvisoryClassName,
  bookingDocClassName,
  bookingDocQuickFieldClassName,
  bookingDocTypeSelectClassName,
  bookingTaskClassName,
  bookingTaskLabelClassName,
  bookingTaskMetaClassName,
  conflictRowClassName,
  conflictSummaryClassName,
  contextRailClassName,
  contextRailClosedClassName,
  contextRailOpenClassName,
  detailButtonClassName,
  detailHeadingClassName,
  detailMapClassName,
  detailMetaLineClassName,
  detailSectionClassName,
  emptyWarningClassName,
  expenseFormClassName,
  expenseGridClassName,
  expenseItemClassName,
  inspectorCloseButtonClassName,
  inspectorTabClassName,
  inspectorTabsClassName,
  inspectorTitleClassName,
  inspectorTitleHeadingClassName,
  mapLinkClassName,
  mapMarkerClassName,
  mapPoiClassName,
  mapRoadBaseClassName,
  mapRoadOneClassName,
  mapRoadThreeClassName,
  mapRoadTwoClassName,
  mapWaterClassName,
  moduleListClassName,
  noteActionButtonClassName,
  noteActionsClassName,
  noteAuthorClassName,
  noteEditActionsClassName,
  noteEditFormClassName,
  noteEditLabelClassName,
  noteEditTextareaClassName,
  noteFormClassName,
  noteFormLabelClassName,
  noteFormTextareaClassName,
  noteHeaderClassName,
  noteItemClassName,
  railInspectorClassName,
  suggestionActionButtonClassName,
  suggestionActionsClassName,
  suggestionItemBaseClassName,
  suggestionItemToneClassNames,
  suggestionListClassName,
} from "./context-rail.styles";

interface ContextRailProps {
  trip: Trip;
  selectedItem?: ItineraryItem;
  suggestions: Suggestion[];
  stopNotes: StopNote[];
  tasks: TripTask[];
  bookingDocs: BookingDoc[];
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  canEdit: boolean;
  canCreateNote: boolean;
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canEditExpenses: boolean;
  open: boolean;
  preferredTab?: ContextRailTab;
  onChangeBookingDocType?: (
    bookingDocId: string,
    type: BookingDocType,
  ) => void | Promise<void>;
  onChangeBookingDocQuickFields?: (
    bookingDocId: string,
    patch: {
      confirmationCode?: string | null;
      providerName?: string | null;
    },
  ) => void | Promise<void>;
  onCreateNote: (input: { itemId: string; body: string }) => void;
  onCreateExpense: (input: {
    itemId: string | null;
    title: string;
    amount: number;
    paidBy: string;
    category: Expense["category"];
  }) => void;
  onUpdateExpense: (input: {
    expenseId: string;
    title: string;
    amount: number;
    paidBy: string;
    category: Expense["category"];
  }) => void;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onEditSelected: () => void;
  onReviewSuggestion: (
    suggestionId: string,
    decision: "approved" | "rejected",
  ) => void;
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
  bookingDocs,
  currentMember,
  expenseSummary,
  canEdit,
  canCreateNote,
  canCreateSuggestion,
  canReviewSuggestions,
  canEditExpenses,
  open,
  preferredTab = "notes",
  onChangeBookingDocType,
  onChangeBookingDocQuickFields,
  onCreateNote,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDeleteNote,
  onEditSelected,
  onReviewSuggestion,
  onSuggestSelected,
  onToggleTaskStatus,
  onUpdateNote,
  onClose,
}: ContextRailProps) {
  const { locale, t } = useI18n();
  const [activeTab, setActiveTab] = useState<ContextRailTab>(preferredTab);
  const [noteBody, setNoteBody] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(currentMember.id);
  const [expenseCategory, setExpenseCategory] =
    useState<Expense["category"]>("food");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const selectedEnd = selectedItem
    ? formatEndTime(selectedItem.startTime, selectedItem.durationMinutes)
    : "";
  const groupSpend = expenseSummary.groupSpend.toLocaleString("en-HK");
  const perPerson = Math.round(
    expenseSummary.groupSpend / Math.max(1, trip.members.length - 1),
  ).toLocaleString("en-HK");
  /* v8 ignore next */
  const selectedAdvisories = selectedItem?.advisories ?? [];
  const selectedNotes = useMemo(() => {
    if (!selectedItem) return [];
    return stopNotes.filter((note) => note.itemId === selectedItem.id);
  }, [selectedItem, stopNotes]);
  const selectedExpenses = useMemo(() => {
    if (!selectedItem) return trip.expenses;
    return trip.expenses.filter(
      (expense) => expense.itineraryItemId === selectedItem.id,
    );
  }, [selectedItem, trip.expenses]);
  const selectedTasks = useMemo(() => {
    if (!selectedItem) return [];
    return tasks.filter(
      (task) =>
        task.relatedItemId === selectedItem.id ||
        (task.kind === "booking" &&
          task.title
            .toLowerCase()
            .includes(selectedItem.activity.toLowerCase())),
    );
  }, [selectedItem, tasks]);
  const selectedBookingDocs = useMemo(() => {
    if (!selectedItem) return [];
    return bookingDocs.filter((bookingDoc) =>
      bookingDoc.relatedItineraryItemIds.includes(selectedItem.id),
    );
  }, [bookingDocs, selectedItem]);
  const selectedSuggestions = useMemo(() => {
    if (!selectedItem) return [];
    return suggestions.filter(
      (suggestion) =>
        suggestion.targetItemId === selectedItem.id &&
        (suggestion.status === "pending" || suggestion.status === "conflicted"),
    );
  }, [selectedItem, suggestions]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setActiveTab(preferredTab);
    });
    return () => {
      cancelled = true;
    };
  }, [open, preferredTab, selectedItem?.id]);

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body || !selectedItem) return;
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

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = expenseTitle.trim();
    const amount = Number(expenseAmount);
    if (!title || !Number.isFinite(amount) || amount < 0) return;
    if (editingExpenseId) {
      onUpdateExpense({
        expenseId: editingExpenseId,
        title,
        amount,
        paidBy: expensePaidBy,
        category: expenseCategory,
      });
    } else {
      onCreateExpense({
        itemId: selectedItem ? selectedItem.id : null,
        title,
        amount,
        paidBy: expensePaidBy,
        category: expenseCategory,
      });
    }
    setEditingExpenseId(null);
    setExpenseTitle("");
    setExpenseAmount("");
  }

  function startEditingExpense(expense: Expense) {
    setEditingExpenseId(expense.id);
    setExpenseTitle(expense.title);
    setExpenseAmount(String(expense.amount));
    setExpensePaidBy(expense.paidBy);
    setExpenseCategory(expense.category);
  }
  return (
    <aside
      className={`${contextRailClassName} ${open ? contextRailOpenClassName : contextRailClosedClassName}`}
      data-state={open ? "open" : "closed"}
      aria-hidden={open ? undefined : true}
      aria-label={t.contextRail.pageLabel}
      inert={open ? undefined : true}
    >
      <div className={railInspectorClassName}>
        <div className={inspectorTitleClassName}>
          <h2 className={inspectorTitleHeadingClassName}>
            {selectedItem
              ? selectedItem.activity
              : t.contextRail.expenses.title}
          </h2>
          <button
            className={inspectorCloseButtonClassName}
            type="button"
            aria-label={t.contextRail.closeDetails}
            onClick={onClose}
          >
            <Icon name="chevronRight" />
          </button>
        </div>

        {selectedItem ? (
          <>
            <div
              className={inspectorTabsClassName}
              role="tablist"
              aria-label={t.contextRail.tabsLabel}
            >
              <button
                className={inspectorTabClassName}
                type="button"
                role="tab"
                aria-selected={activeTab === "notes"}
                onClick={() => setActiveTab("notes")}
              >
                {t.contextRail.tabs.notes}
              </button>
              <button
                className={inspectorTabClassName}
                type="button"
                role="tab"
                aria-selected={activeTab === "booking"}
                onClick={() => setActiveTab("booking")}
              >
                {t.contextRail.tabs.booking}
              </button>
              <button
                className={inspectorTabClassName}
                type="button"
                role="tab"
                aria-selected={activeTab === "suggestions"}
                onClick={() => setActiveTab("suggestions")}
              >
                {t.contextRail.tabs.suggestions}
              </button>
            </div>

            <section
              className={detailSectionClassName}
              aria-label={t.contextRail.detailLabel}
            >
              <p className={detailMetaLineClassName}>
                <Icon name="utensils" />{" "}
                {activityTypeLabel(selectedItem.activityType, locale)}
              </p>
              <p className={detailMetaLineClassName}>
                <Icon name="clock" /> {selectedItem.startTime} – {selectedEnd} (
                {formatDuration(selectedItem.durationMinutes, locale)})
              </p>
              <p className={detailMetaLineClassName}>
                <Icon name="location" />{" "}
                {selectedItem.address ?? selectedItem.place}
              </p>
              <a
                className={mapLinkClassName}
                href={safeExternalHref(selectedItem.mapLink) || "#"}
              >
                {t.contextRail.openMaps}
              </a>
              <div
                className={detailMapClassName}
                aria-label={t.contextRail.mapPreview}
              >
                <span
                  className={`${mapRoadBaseClassName} ${mapRoadOneClassName}`}
                />
                <span
                  className={`${mapRoadBaseClassName} ${mapRoadTwoClassName}`}
                />
                <span
                  className={`${mapRoadBaseClassName} ${mapRoadThreeClassName}`}
                />
                <span className={mapWaterClassName} />
                <span
                  className={`${mapPoiClassName} map-poi-1 left-[58px] top-[18px]`}
                >
                  Austin
                </span>
                <span className={`${mapPoiClassName} map-poi-2 right-10 top-5`}>
                  Jordan
                </span>
                <span className={mapMarkerClassName}>
                  <Icon name="location" />
                </span>
              </div>
              {canEdit ? (
                <Button
                  type="button"
                  variant="secondary"
                  className={detailButtonClassName}
                  onClick={onEditSelected}
                >
                  {t.contextRail.editDetails}
                </Button>
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
              <section
                className={`${detailSectionClassName} stop-notes-module`}
                aria-label={t.contextRail.notes.label}
              >
                <h3 className={detailHeadingClassName}>
                  {t.contextRail.notes.title}
                </h3>
                <div className={`stop-note-list ${moduleListClassName}`}>
                  {selectedNotes.map((note) => {
                    const author = trip.members.find(
                      (member) => member.id === note.authorId,
                    );
                    const canManageNote =
                      canEdit || note.authorId === currentMember.id;
                    return (
                      <article className={noteItemClassName} key={note.id}>
                        <div className={noteHeaderClassName}>
                          <strong>
                            {memberDisplayName(
                              author,
                              t.appShell.roles.traveler,
                            )}
                          </strong>
                          {canManageNote ? (
                            <span className={noteActionsClassName}>
                              <button
                                className={noteActionButtonClassName}
                                type="button"
                                aria-label={t.contextRail.notes.editBy({
                                  name: memberDisplayName(
                                    author,
                                    t.appShell.roles.traveler,
                                  ),
                                })}
                                onClick={() => startEditingNote(note)}
                              >
                                <Icon name="edit" />
                              </button>
                              <button
                                className={noteActionButtonClassName}
                                type="button"
                                aria-label={t.contextRail.notes.deleteBy({
                                  name: memberDisplayName(
                                    author,
                                    t.appShell.roles.traveler,
                                  ),
                                })}
                                onClick={() => onDeleteNote(note.id)}
                              >
                                <Icon name="trash" />
                              </button>
                            </span>
                          ) : null}
                        </div>
                        {editingNoteId === note.id ? (
                          <form
                            className={noteEditFormClassName}
                            onSubmit={submitNoteEdit}
                          >
                            <label className={noteEditLabelClassName}>
                              <span>{t.contextRail.notes.editNote}</span>
                              <textarea
                                className={noteEditTextareaClassName}
                                value={editingNoteBody}
                                onChange={(event) =>
                                  setEditingNoteBody(event.target.value)
                                }
                                rows={3}
                              />
                            </label>
                            <div className={noteEditActionsClassName}>
                              <Button
                                type="button"
                                variant="ghost"
                                className={detailButtonClassName}
                                onClick={() => setEditingNoteId(null)}
                              >
                                {t.common.actions.cancel}
                              </Button>
                              <Button
                                type="submit"
                                variant="secondary"
                                className={detailButtonClassName}
                                disabled={!editingNoteBody.trim()}
                              >
                                {t.contextRail.notes.saveEdit}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <p>{note.body}</p>
                        )}
                      </article>
                    );
                  })}
                  {!selectedNotes.length ? (
                    <p className={emptyWarningClassName}>
                      {t.contextRail.notes.empty}
                    </p>
                  ) : null}
                </div>
                <form className={noteFormClassName} onSubmit={submitNote}>
                  <label className={noteFormLabelClassName}>
                    <span>{t.contextRail.notes.add}</span>
                    <textarea
                      className={noteFormTextareaClassName}
                      value={noteBody}
                      disabled={!canCreateNote}
                      onChange={(event) => setNoteBody(event.target.value)}
                      rows={3}
                    />
                  </label>
                  <span className={noteAuthorClassName}>
                    {t.contextRail.notes.savedAs({
                      name: currentMember.displayName,
                    })}
                  </span>
                  <Button
                    type="submit"
                    variant="secondary"
                    className={detailButtonClassName}
                    disabled={!canCreateNote || !noteBody.trim()}
                  >
                    {t.contextRail.notes.save}
                  </Button>
                </form>
              </section>
            ) : null}

            {activeTab === "booking" ? (
              <section
                className={`${detailSectionClassName} stop-booking-module`}
                aria-label={t.contextRail.booking.label}
              >
                <h3 className={detailHeadingClassName}>
                  {t.contextRail.booking.title}
                </h3>
                <div className={`booking-advisory-list ${moduleListClassName}`}>
                  {selectedAdvisories.map((advisory) => (
                    <span
                      className={`${bookingAdvisoryClassName} booking-advisory--${advisory.severity}`}
                      key={advisory.code}
                    >
                      <Icon name="alertCircle" /> {advisory.label}
                    </span>
                  ))}
                  {!selectedItem.advisories?.length ? (
                    <span className={emptyWarningClassName}>
                      {t.contextRail.booking.noWarnings}
                    </span>
                  ) : null}
                </div>
                <ul className={`stop-booking-doc-list ${moduleListClassName}`}>
                  {selectedBookingDocs.map((bookingDoc) => (
                    <li className={bookingDocClassName} key={bookingDoc.id}>
                      <strong>{bookingDoc.title}</strong>
                      <span>
                        {t.contextRail.booking.booking} · {bookingDoc.status}
                      </span>
                      <label className="grid gap-1">
                        <span>{t.contextRail.booking.type}</span>
                        <Select
                          aria-label={t.contextRail.booking.typeFor({
                            title: bookingDoc.title,
                          })}
                          className={bookingDocTypeSelectClassName}
                          disabled={!canEdit || !onChangeBookingDocType}
                          value={bookingDoc.type}
                          onChange={(event) =>
                            void onChangeBookingDocType?.(
                              bookingDoc.id,
                              event.target.value as BookingDocType,
                            )
                          }
                        >
                          {bookingDocTypeOptions.map((type) => (
                            <option key={type} value={type}>
                              {formatBookingDocTypeLabel(type)}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label className="grid gap-1">
                        <span>{t.contextRail.booking.provider}</span>
                        <input
                          aria-label={t.contextRail.booking.providerFor({
                            title: bookingDoc.title,
                          })}
                          className={bookingDocQuickFieldClassName}
                          defaultValue={bookingDoc.providerName ?? ""}
                          disabled={!canEdit || !onChangeBookingDocQuickFields}
                          placeholder={t.contextRail.booking.providerPlaceholder}
                          onChange={(event) => {
                            event.currentTarget.dataset.draftValue =
                              event.currentTarget.value;
                          }}
                          onBlur={(event) => {
                            const value = (
                              event.currentTarget.dataset.draftValue ??
                              event.currentTarget.value
                            ).trim();
                            if (value === (bookingDoc.providerName ?? "")) return;
                            void onChangeBookingDocQuickFields?.(bookingDoc.id, {
                              providerName: value || null,
                            });
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter") return;
                            event.preventDefault();
                            const value = (
                              event.currentTarget.dataset.draftValue ??
                              event.currentTarget.value
                            ).trim();
                            if (value === (bookingDoc.providerName ?? "")) return;
                            void onChangeBookingDocQuickFields?.(bookingDoc.id, {
                              providerName: value || null,
                            });
                          }}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span>{t.contextRail.booking.reference}</span>
                        <input
                          aria-label={t.contextRail.booking.referenceFor({
                            title: bookingDoc.title,
                          })}
                          className={bookingDocQuickFieldClassName}
                          defaultValue={bookingDoc.confirmationCode ?? ""}
                          disabled={!canEdit || !onChangeBookingDocQuickFields}
                          placeholder={t.contextRail.booking.referencePlaceholder}
                          onChange={(event) => {
                            event.currentTarget.dataset.draftValue =
                              event.currentTarget.value;
                          }}
                          onBlur={(event) => {
                            const value = (
                              event.currentTarget.dataset.draftValue ??
                              event.currentTarget.value
                            ).trim();
                            if (value === (bookingDoc.confirmationCode ?? "")) return;
                            void onChangeBookingDocQuickFields?.(bookingDoc.id, {
                              confirmationCode: value || null,
                            });
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter") return;
                            event.preventDefault();
                            const value = (
                              event.currentTarget.dataset.draftValue ??
                              event.currentTarget.value
                            ).trim();
                            if (value === (bookingDoc.confirmationCode ?? "")) return;
                            void onChangeBookingDocQuickFields?.(bookingDoc.id, {
                              confirmationCode: value || null,
                            });
                          }}
                        />
                      </label>
                    </li>
                  ))}
                  {!selectedBookingDocs.length ? (
                    <li className={emptyWarningClassName}>
                      {t.contextRail.booking.noBookings}
                    </li>
                  ) : null}
                </ul>
                <ul className={`stop-booking-task-list ${moduleListClassName}`}>
                  {selectedTasks.map((task) => (
                    <li
                      className={bookingTaskClassName}
                      data-status={task.status}
                      key={task.id}
                    >
                      <label className={bookingTaskLabelClassName}>
                        <input
                          type="checkbox"
                          checked={task.status === "done"}
                          disabled={!canEdit}
                          onChange={() => onToggleTaskStatus(task.id)}
                        />
                        <span>{task.title}</span>
                      </label>
                      <small className={bookingTaskMetaClassName}>
                        {taskKindLabel(task, t.contextRail.booking)}
                      </small>
                    </li>
                  ))}
                  {!selectedTasks.length ? (
                    <li className={emptyWarningClassName}>
                      {t.contextRail.booking.noTasks}
                    </li>
                  ) : null}
                </ul>
              </section>
            ) : null}

            {activeTab === "suggestions" ? (
              <section
                className={`${detailSectionClassName} suggestion-module`}
                aria-label={t.contextRail.suggestions.label}
              >
                <div className="module-title-row flex items-center justify-between gap-2.5">
                  <h3 className={detailHeadingClassName}>
                    {t.contextRail.suggestions.title({
                      count: selectedSuggestions.length,
                    })}
                  </h3>
                  <span>
                    {canReviewSuggestions
                      ? t.contextRail.suggestions.pending
                      : t.contextRail.suggestions.readOnly}
                  </span>
                </div>
                <div className={suggestionListClassName}>
                  {selectedSuggestions.map((suggestion) => {
                    const proposer = trip.members.find(
                      (member) => member.id === suggestion.proposerId,
                    );
                    const label = suggestionLabel(
                      suggestion,
                      t.contextRail.suggestions.fallback,
                    );
                    return (
                      <article
                        className={`${suggestionItemBaseClassName} ${suggestion.status === "conflicted" ? suggestionItemToneClassNames.conflicted : suggestionItemToneClassNames.pending}`}
                        key={suggestion.id}
                      >
                        <Icon
                          name={
                            suggestion.status === "conflicted"
                              ? "alertCircle"
                              : "check"
                          }
                        />
                        <div>
                          <strong>{label}</strong>
                          <span>
                            {t.contextRail.suggestions.suggestedUpdate({
                              name: memberDisplayName(
                                proposer,
                                t.appShell.roles.traveler,
                              ),
                            })}
                          </span>
                          {canReviewSuggestions ? (
                            <div className={suggestionActionsClassName}>
                              <button
                                className={suggestionActionButtonClassName}
                                type="button"
                                onClick={() =>
                                  onReviewSuggestion(suggestion.id, "approved")
                                }
                              >
                                {t.contextRail.suggestions.approve({ label })}
                              </button>
                              <button
                                className={suggestionActionButtonClassName}
                                type="button"
                                onClick={() =>
                                  onReviewSuggestion(suggestion.id, "rejected")
                                }
                              >
                                {t.contextRail.suggestions.reject({ label })}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  {!selectedSuggestions.length ? (
                    <p className={emptyWarningClassName}>
                      {t.contextRail.suggestions.empty}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section
              className={`${detailSectionClassName} conflict-section`}
              aria-label={t.contextRail.conflicts.label}
            >
              <h3 className={detailHeadingClassName}>
                {t.contextRail.conflicts.title}
              </h3>
              <div className={conflictRowClassName}>
                <span className={conflictSummaryClassName}>
                  <Icon name="alertCircle" />{" "}
                  {t.contextRail.conflicts.peakWarning}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-[11px]"
                  disabled={!canReviewSuggestions}
                >
                  {t.contextRail.conflicts.autoFix}
                </Button>
              </div>
            </section>
          </>
        ) : null}

        <section
          className={`${detailSectionClassName} expense-module`}
          aria-label={t.contextRail.expenses.label}
        >
          {selectedItem ? (
            <h3 className={detailHeadingClassName}>
              {t.contextRail.expenses.title}
            </h3>
          ) : null}
          <div className={expenseGridClassName}>
            <span>{t.contextRail.expenses.perPerson}</span>
            <strong>HK${perPerson}</strong>
            <span>
              {t.contextRail.expenses.totalFor({
                count: trip.members.length - 1,
              })}
            </span>
            <strong>HK${groupSpend}</strong>
          </div>
          <div className={moduleListClassName}>
            {selectedExpenses.map((expense) => (
              <article className={expenseItemClassName} key={expense.id}>
                <span>
                  <strong>{expense.title}</strong>
                  <br />
                  HK${expense.amount.toLocaleString("en-HK")}
                </span>
                <span className={noteActionsClassName}>
                  <button
                    className={noteActionButtonClassName}
                    type="button"
                    aria-label={`Edit expense ${expense.title}`}
                    disabled={!canEditExpenses}
                    onClick={() => startEditingExpense(expense)}
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    className={noteActionButtonClassName}
                    type="button"
                    aria-label={`Delete expense ${expense.title}`}
                    disabled={!canEditExpenses}
                    onClick={() => onDeleteExpense(expense.id)}
                  >
                    <Icon name="trash" />
                  </button>
                </span>
              </article>
            ))}
          </div>
          <form className={expenseFormClassName} onSubmit={submitExpense}>
            <p className="m-0 text-[11px] font-bold leading-4 text-(--color-text-muted)">
              {t.contextRail.expenses.actualOnlyHint}
            </p>
            <label>
              <span>{t.contextRail.expenses.formTitle}</span>
              <input
                value={expenseTitle}
                disabled={!canEditExpenses}
                onChange={(event) => setExpenseTitle(event.target.value)}
              />
            </label>
            <label>
              <span>{t.contextRail.expenses.formAmount}</span>
              <input
                inputMode="decimal"
                value={expenseAmount}
                disabled={!canEditExpenses}
                onChange={(event) => setExpenseAmount(event.target.value)}
              />
            </label>
            <label>
              <span>{t.contextRail.expenses.formPaidBy}</span>
              <Select
                value={expensePaidBy}
                disabled={!canEditExpenses}
                onChange={(event) => setExpensePaidBy(event.target.value)}
              >
                {trip.members.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span>{t.contextRail.expenses.formCategory}</span>
              <Select
                value={expenseCategory}
                disabled={!canEditExpenses}
                onChange={(event) =>
                  setExpenseCategory(event.target.value as Expense["category"])
                }
              >
                {(
                  [
                    "food",
                    "transport",
                    "tickets",
                    "stay",
                    "shopping",
                    "settlement",
                  ] satisfies Expense["category"][]
                ).map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              type="submit"
              variant="secondary"
              className={detailButtonClassName}
              disabled={
                !canEditExpenses ||
                !expenseTitle.trim() ||
                !expenseAmount.trim()
              }
            >
              {editingExpenseId
                ? t.common.actions.save
                : t.contextRail.expenses.edit}
            </Button>
          </form>
        </section>
      </div>
    </aside>
  );
}
