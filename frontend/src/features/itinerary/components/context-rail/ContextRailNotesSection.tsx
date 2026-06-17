import { FormEvent, useState } from "react";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { memberDisplayName } from "../context-rail.utils";
import type {
  ItineraryItem,
  Member,
  StopNote,
  Trip,
} from "@/src/trip/types";
import {
  detailHeadingClassName,
  detailButtonClassName,
  detailSectionClassName,
  emptyWarningClassName,
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
  moduleListClassName,
} from "../context-rail.styles";

interface ContextRailNotesSectionProps {
  itemId: ItineraryItem["id"] | undefined;
  notes: StopNote[];
  tripMembers: Trip["members"];
  currentMember: Member;
  canCreateNote: boolean;
  canEdit: boolean;
  onCreateNote: (input: { itemId: string; body: string }) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (input: { noteId: string; body: string }) => void;
}

export function ContextRailNotesSection({
  itemId,
  notes,
  currentMember,
  tripMembers,
  canCreateNote,
  canEdit,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
}: ContextRailNotesSectionProps) {
  const { t } = useI18n();
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body || !itemId) return;
    onCreateNote({ itemId, body });
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
    <section
      className={`${detailSectionClassName} stop-notes-module`}
      aria-label={t.contextRail.notes.label}
    >
      <h3 className={detailHeadingClassName}>{t.contextRail.notes.title}</h3>
      <div className={`stop-note-list ${moduleListClassName}`}>
        {notes.map((note) => {
          const author = tripMembers.find((member) => member.id === note.authorId);
          const canManageNote = canEdit || note.authorId === currentMember.id;
          return (
            <article className={noteItemClassName} key={note.id}>
              <div className={noteHeaderClassName}>
                <strong>
                  {memberDisplayName(author, t.appShell.roles.traveler)}
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
                <form className={noteEditFormClassName} onSubmit={submitNoteEdit}>
                  <label className={noteEditLabelClassName}>
                    <span>{t.contextRail.notes.editNote}</span>
                    <textarea
                      className={noteEditTextareaClassName}
                      value={editingNoteBody}
                      onChange={(event) => setEditingNoteBody(event.target.value)}
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
        {!notes.length ? (
          <p className={emptyWarningClassName}>{t.contextRail.notes.empty}</p>
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
          {t.contextRail.notes.savedAs({ name: currentMember.displayName })}
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
  );
}
