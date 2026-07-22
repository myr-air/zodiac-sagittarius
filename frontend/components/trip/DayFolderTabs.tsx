/**
 * Plan Day folder tabs — Theme A Calm Travel Ops (M80VKAX5 T2).
 * Draft: day-tabs tablist + day-tab + day-add.
 */

export type DayFolderTabsProps = {
  /** Inclusive Plan Day ISO dates (YYYY-MM-DD). */
  days: string[];
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  onAddDay: () => void;
};

/** Short weekday + date subtitle for folder tabs (UTC calendar day). */
function formatDaySubtitle(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Folder-style Plan Day tabs with an Add day control.
 */
export function DayFolderTabs({
  days,
  selectedDay,
  onSelectDay,
  onAddDay,
}: DayFolderTabsProps) {
  return (
    <div
      className="day-tabs flex items-end gap-1 overflow-x-auto border-b border-(--color-border) bg-(--color-page) px-6 pt-3"
      role="tablist"
      aria-label="Plan days"
    >
      {days.map((day, index) => {
        const selected = day === selectedDay;
        return (
          <button
            key={day}
            type="button"
            role="tab"
            className={`day-tab min-w-[108px] shrink-0 rounded-t-lg border border-b-0 border-(--color-border) px-3.5 py-2.5 text-left transition-[background,color] duration-180 ${
              selected
                ? "active relative top-px bg-(--color-surface) text-(--color-text) shadow-[0_-1px_0_var(--color-surface)]"
                : "bg-(--color-surface-muted) text-(--color-text-muted)"
            }`}
            aria-selected={selected ? "true" : "false"}
            onClick={() => onSelectDay(day)}
          >
            <strong
              className={`block text-[13px] font-semibold ${
                selected ? "text-(--color-primary-strong)" : "text-inherit"
              }`}
            >
              Day {index + 1}
            </strong>
            <span className="text-[11px] text-(--color-text-subtle) tabular-nums">
              {formatDaySubtitle(day)}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="day-add mb-2 ml-1 flex size-11 shrink-0 items-center justify-center rounded-md border border-dashed border-(--color-border-strong) bg-transparent text-xl font-medium text-(--color-primary)"
        aria-label="Add day"
        onClick={onAddDay}
      >
        +
      </button>
    </div>
  );
}
