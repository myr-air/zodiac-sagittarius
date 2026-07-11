import type { FormEvent } from "react";
import { Button } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  detailButtonClassName,
  noteAuthorClassName,
  noteFormClassName,
  noteFormLabelClassName,
  noteFormTextareaClassName,
} from "./context-rail.styles";

interface ContextRailNoteComposerProps {
  canCreateNote: boolean;
  currentMemberName: string;
  noteBody: string;
  onBlurNote?: () => void;
  onNoteBodyChange: (body: string) => void;
  onSubmitNote: (event: FormEvent<HTMLFormElement>) => void;
}

export function ContextRailNoteComposer({
  canCreateNote,
  currentMemberName,
  noteBody,
  onBlurNote,
  onNoteBodyChange,
  onSubmitNote,
}: ContextRailNoteComposerProps) {
  const { t } = useI18n();

  return (
    <form className={noteFormClassName} onSubmit={onSubmitNote}>
      <label className={noteFormLabelClassName}>
        <span>{t.contextRail.notes.add}</span>
        <textarea
          className={noteFormTextareaClassName}
          value={noteBody}
          disabled={!canCreateNote}
          onChange={(event) => onNoteBodyChange(event.target.value)}
          onBlur={(event) => {
            const relatedTarget = event.relatedTarget as Node | null;
            if (relatedTarget && event.currentTarget.form?.contains(relatedTarget)) {
              return;
            }
            onBlurNote?.();
          }}
          rows={3}
        />
      </label>
      <span className={noteAuthorClassName}>
        {t.contextRail.notes.savedAs({ name: currentMemberName })}
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
  );
}
