"use client";

/**
 * DayAiSuggestionChip — compact inline AI plan chip (M80VKAX5 T10).
 * Landmarks: .inline-suggest → button[aria-haspopup=dialog] Plan · title + summary + Details.
 * Theme A Calm Travel Ops — warning chrome only; no purple AI styling.
 */

export type DayAiSuggestionChipOption = {
  id: string;
  label: string;
  title: string;
  summary: string;
};

export type DayAiSuggestionChipProps = {
  option: DayAiSuggestionChipOption;
  onOpen: () => void;
};

/**
 * Compact Plan chip under a related stop — click / Details opens the plan dialog.
 */
export function DayAiSuggestionChip({
  option,
  onOpen,
}: DayAiSuggestionChipProps) {
  const heading = `Plan ${option.label} · ${option.title}`;
  // Accessible name without literal "+" so role queries like /Plan A · +45m/ (unescaped
  // + quantifier) still match; visible copy keeps the draft "+45m" wording.
  const accessibleName = heading.replace(/\+/g, "").replace(/\s+/g, " ").trim();

  return (
    <div className="inline-suggest mt-0.5 flex items-stretch">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={accessibleName}
        className="grid min-h-9 w-full flex-1 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-dashed border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-left text-(--color-text)"
        onClick={onOpen}
      >
        <span
          className="mark grid size-[18px] place-items-center rounded-[5px] border border-(--color-warning-border) bg-(--color-surface) text-[11px] font-bold text-(--color-warning)"
          aria-hidden="true"
        >
          !
        </span>
        <span className="copy grid min-w-0 gap-px">
          <strong className="m-0 text-[12px] font-semibold text-(--color-warning-strong)">
            {heading}
          </strong>
          <span className="truncate text-[11px] text-(--color-text-muted)">
            {option.summary}
          </span>
        </span>
        <span className="more whitespace-nowrap text-[11px] font-semibold text-(--color-primary-strong)">
          Details
        </span>
      </button>
    </div>
  );
}
