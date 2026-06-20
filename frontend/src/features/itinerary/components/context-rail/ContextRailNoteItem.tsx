import type { FormEvent } from "react";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Member, StopNote } from "@/src/trip/types";
import {
  detailButtonClassName,
  noteActionButtonClassName,
  noteActionsClassName,
  noteEditActionsClassName,
  noteEditFormClassName,
  noteEditLabelClassName,
  noteEditTextareaClassName,
  noteHeaderClassName,
  noteItemClassName,
} from "./context-rail.styles";
import { memberDisplayName } from "./context-rail.utils";

interface ContextRailNoteItemProps {
  author: Member | undefined;
  canManageNote: boolean;
  editingNoteBody: string;
  isEditing: boolean;
  note: StopNote;
  onCancelEditingNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onEditingNoteBodyChange: (body: string) => void;
  onStartEditingNote: (note: StopNote) => void;
  onSubmitNoteEdit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ContextRailNoteItem({
  author,
  canManageNote,
  editingNoteBody,
  isEditing,
  note,
  onCancelEditingNote,
  onDeleteNote,
  onEditingNoteBodyChange,
  onStartEditingNote,
  onSubmitNoteEdit,
}: ContextRailNoteItemProps) {
  const { t } = useI18n();
  const authorName = memberDisplayName(author, t.appShell.roles.traveler);

  return (
    <article className={noteItemClassName}>
      <div className={noteHeaderClassName}>
        <strong>{authorName}</strong>
        {canManageNote ? (
          <span className={noteActionsClassName}>
            <button
              className={noteActionButtonClassName}
              type="button"
              aria-label={t.contextRail.notes.editBy({ name: authorName })}
              onClick={() => onStartEditingNote(note)}
            >
              <Icon name="edit" />
            </button>
            <button
              className={noteActionButtonClassName}
              type="button"
              aria-label={t.contextRail.notes.deleteBy({ name: authorName })}
              onClick={() => onDeleteNote(note.id)}
            >
              <Icon name="trash" />
            </button>
          </span>
        ) : null}
      </div>
      {isEditing ? (
        <form className={noteEditFormClassName} onSubmit={onSubmitNoteEdit}>
          <label className={noteEditLabelClassName}>
            <span>{t.contextRail.notes.editNote}</span>
            <textarea
              className={noteEditTextareaClassName}
              value={editingNoteBody}
              onChange={(event) => onEditingNoteBodyChange(event.target.value)}
              rows={3}
            />
          </label>
          <div className={noteEditActionsClassName}>
            <Button
              type="button"
              variant="ghost"
              className={detailButtonClassName}
              onClick={onCancelEditingNote}
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
}
