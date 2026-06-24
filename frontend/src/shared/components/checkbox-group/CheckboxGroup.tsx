interface CheckboxGroupProps {
  label: string;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxHeightClassName?: string;
}

export function CheckboxGroup({
  label,
  options,
  selectedIds,
  onToggle,
  maxHeightClassName = "max-h-36",
}: CheckboxGroupProps) {
  if (!options.length) return null;

  return (
    <fieldset className="grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-3">
      <legend className="px-1 text-[11px] font-extrabold text-(--color-text-muted)">{label}</legend>
      <div className={`grid ${maxHeightClassName} gap-1.5 overflow-auto pr-1`}>
        {options.map((option) => (
          <label className="grid min-h-8 grid-cols-[18px_minmax(0,1fr)] items-center gap-2 text-xs font-bold text-(--color-text)" key={option.id}>
            <input type="checkbox" checked={selectedIds.includes(option.id)} onChange={() => onToggle(option.id)} />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
