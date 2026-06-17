import { useRef, useState } from "react";
import {
  dayTitleInputClassName,
  dayTitleMaxLength,
  dayTitleMinWidthCh,
} from "../smart-itinerary-table.styles";

interface DayTitleEditorProps {
  canEdit: boolean;
  date: string;
  dayLabel: string;
  defaultTitle: string;
  onSaveDayTitle?: (
    date: string,
    version: number,
    title: string | null,
  ) => void | Promise<void>;
  title: string;
  version: number;
}

export function DayTitleEditor({
  canEdit,
  date,
  dayLabel,
  defaultTitle,
  onSaveDayTitle,
  title,
  version,
}: DayTitleEditorProps) {
  const [draft, setDraft] = useState(title.slice(0, dayTitleMaxLength));
  const [sourceTitle, setSourceTitle] = useState(title.slice(0, dayTitleMaxLength));
  const [saving, setSaving] = useState(false);
  const suppressNextCommitRef = useRef(false);
  const dynamicWidthCh = Math.max(
    dayTitleMinWidthCh,
    Math.min(dayTitleMaxLength, draft.length || defaultTitle.length) + 1,
  );

  async function commit(nextValue: string) {
    if (!canEdit || !onSaveDayTitle || saving) return;
    if (suppressNextCommitRef.current) {
      suppressNextCommitRef.current = false;
      return;
    }
    const trimmed = nextValue.trim();
    const normalizedTitle = trimmed || defaultTitle;
    if (normalizedTitle === sourceTitle) {
      setDraft(sourceTitle);
      return;
    }
    setSaving(true);
    try {
      await onSaveDayTitle(date, version, trimmed ? normalizedTitle : null);
      setSourceTitle(normalizedTitle);
      setDraft(normalizedTitle);
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      aria-label={`Trip day title for ${dayLabel}`}
      data-day-label={dayLabel}
      className={dayTitleInputClassName}
      disabled={!canEdit || saving}
      maxLength={dayTitleMaxLength}
      style={{ width: `${dynamicWidthCh}ch` }}
      title={`${draft.length}/${dayTitleMaxLength}`}
      value={draft}
      onBlur={() => void commit(draft)}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          suppressNextCommitRef.current = true;
          setDraft(sourceTitle);
          event.currentTarget.blur();
        }
      }}
    />
  );
}
