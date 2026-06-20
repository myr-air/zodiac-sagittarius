import { useI18n } from "@/src/i18n/I18nProvider";
import { ContextRailNoteComposer } from "./ContextRailNoteComposer";
import { ContextRailNoteItem } from "./ContextRailNoteItem";
import { useContextRailNoteForm } from "./use-context-rail-note-form";
import type {
  ContextRailCreateNoteInput,
  ContextRailUpdateNoteInput,
} from "./context-rail.types";
import type {
  ItineraryItem,
  Member,
  StopNote,
  Trip,
} from "@/src/trip/types";
import {
  detailHeadingClassName,
  detailSectionClassName,
  emptyWarningClassName,
  moduleListClassName,
} from "./context-rail.styles";

interface ContextRailNotesSectionProps {
  itemId: ItineraryItem["id"] | undefined;
  notes: StopNote[];
  tripMembers: Trip["members"];
  currentMember: Member;
  canCreateNote: boolean;
  canEdit: boolean;
  onCreateNote: (input: ContextRailCreateNoteInput) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (input: ContextRailUpdateNoteInput) => void;
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
  const {
    cancelEditingNote,
    editingNoteBody,
    editingNoteId,
    noteBody,
    setEditingNoteBody,
    setNoteBody,
    startEditingNote,
    submitNote,
    submitNoteEdit,
  } = useContextRailNoteForm({
    itemId,
    onCreateNote,
    onUpdateNote,
  });

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
            <ContextRailNoteItem
              key={note.id}
              author={author}
              canManageNote={canManageNote}
              editingNoteBody={editingNoteBody}
              isEditing={editingNoteId === note.id}
              note={note}
              onCancelEditingNote={cancelEditingNote}
              onDeleteNote={onDeleteNote}
              onEditingNoteBodyChange={setEditingNoteBody}
              onStartEditingNote={startEditingNote}
              onSubmitNoteEdit={submitNoteEdit}
            />
          );
        })}
        {!notes.length ? (
          <p className={emptyWarningClassName}>{t.contextRail.notes.empty}</p>
        ) : null}
      </div>
      <ContextRailNoteComposer
        canCreateNote={canCreateNote}
        currentMemberName={currentMember.displayName}
        noteBody={noteBody}
        onNoteBodyChange={setNoteBody}
        onSubmitNote={submitNote}
      />
    </section>
  );
}
