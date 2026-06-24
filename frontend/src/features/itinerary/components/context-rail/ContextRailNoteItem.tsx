import type { FormEvent } from "react";
import { Button } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Member, StopNote } from "@/src/trip/types";
import {
  detailButtonClassName,
  noteEditActionsClassName,
  noteEditFormClassName,
  noteEditLabelClassName,
  noteEditTextareaClassName,
  noteHeaderClassName,
  noteItemClassName,
} from "./context-rail.styles";
import { memberDisplayName } from "@/src/features/itinerary/domain/itinerary-context-rail-display";
import { ContextRailItemActionButtons } from "./ContextRailItemActionButtons";

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
          <ContextRailItemActionButtons
            actions={[
              {
                ariaLabel: t.contextRail.notes.editBy({ name: authorName }),
                icon: "edit",
                onClick: () => onStartEditingNote(note),
              },
              {
                ariaLabel: t.contextRail.notes.deleteBy({ name: authorName }),
                icon: "trash",
                onClick: () => onDeleteNote(note.id),
              },
            ]}
          />
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
