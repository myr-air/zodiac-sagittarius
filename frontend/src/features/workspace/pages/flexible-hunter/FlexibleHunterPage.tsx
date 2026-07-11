import { useCallback, useMemo, useRef, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspacePage } from "@/src/ui";
import { DateWindowRangeSlider } from "@/src/shared/components/date-window-slider/DateWindowRangeSlider";
import { BudgetCategoryCard } from "@/src/features/workspace/components/budget/BudgetCategoryCard";
import { BudgetProgressBar } from "@/src/features/workspace/components/budget/BudgetProgressBar";
import type { FlexibleHunterPageProps } from "./FlexibleHunterPage.types";
import {
  categoryGridClass,
  emptyStateClass,
  emptyStateTextClass,
  pageClass,
  sectionClass,
  sectionTitleClass,
  sliderSectionClass,
  totalBudgetLabelClass,
  totalBudgetSectionClass,
  whatIfRadioClass,
  whatIfRadioDisabledClass,
  whatIfRadioGroupClass,
  whatIfRadioInputClass,
  whatIfRadioSelectedClass,
  whatIfSectionClass,
  whatIfShiftedLabelClass,
} from "./FlexibleHunterPage.styles";

type WhatIfOption = "earlier" | "later" | "custom" | null;

/** Shift a YYYY-MM-DD string by ±days. Returns the new date as YYYY-MM-DD. */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format a YYYY-MM-DD string to "MMM DD" (e.g., "Mar 15"). */
function formatShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const WHAT_IF_OPTIONS = [
  { value: "earlier" as const, shiftDays: -7 },
  { value: "later" as const, shiftDays: 7 },
  { value: "custom" as const, shiftDays: 0, disabled: true },
];

export function FlexibleHunterPage({ trip, onDateWindowChange, onBudgetEdit }: FlexibleHunterPageProps) {
  const { t } = useI18n();
  const [whatIf, setWhatIf] = useState<WhatIfOption>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const whatIfLabels: Record<string, string> = {
    earlier: t.flexibleHunter.whatIfOptionEarlier,
    later: t.flexibleHunter.whatIfOptionLater,
    custom: t.flexibleHunter.whatIfOptionCustom,
  };

  /** Compute the min/max window for the slider. */
  const { minDate, maxDate } = useMemo(() => {
    const baseStart = trip.startDate || getDefaultWindowCentered(12);
    const baseEnd = trip.endDate || shiftDate(baseStart, 30 * 12);
    // Extend window by 3 months on each side for flexibility
    const d = new Date(`${baseStart}T00:00:00`);
    d.setMonth(d.getMonth() - 3);
    const minY = d.getFullYear();
    const minM = String(d.getMonth() + 1).padStart(2, "0");
    const min = `${minY}-${minM}-01`;

    const d2 = new Date(`${baseEnd}T00:00:00`);
    d2.setMonth(d2.getMonth() + 3);
    const maxY = d2.getFullYear();
    const maxM = String(d2.getMonth() + 1).padStart(2, "0");
    // Last day of month
    const max = `${maxY}-${maxM}-01`;

    return { minDate: min, maxDate: max };
  }, [trip.startDate, trip.endDate]);

  /** Current date window values for the slider. */
  const { sliderStart, sliderEnd } = useMemo(() => {
    const s = trip.dateWindowStart || minDate;
    const e = trip.dateWindowEnd || maxDate;
    return { sliderStart: s, sliderEnd: e };
  }, [trip.dateWindowStart, trip.dateWindowEnd, minDate, maxDate]);

  /** Debounced date window change. */
  const handleDateChange = useCallback(
    (start: string, end: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onDateWindowChange(start, end);
      }, 150);
    },
    [onDateWindowChange],
  );

  /** Compute what-if shifted dates based on selected option. */
  const whatIfShifted = useMemo(() => {
    if (!whatIf || whatIf === "custom") return null;
    const option = WHAT_IF_OPTIONS.find((o) => o.value === whatIf);
    if (!option || option.disabled) return null;
    const shiftedStart = shiftDate(sliderStart, option.shiftDays);
    const shiftedEnd = shiftDate(sliderEnd, option.shiftDays);
    return { start: shiftedStart, end: shiftedEnd };
  }, [whatIf, sliderStart, sliderEnd]);

  const budgetCategories = trip.budgetCategories ?? [];

  /** Aggregate budget totals. */
  const totalEstimated = useMemo(
    () => budgetCategories.reduce((sum, c) => sum + c.estimated, 0),
    [budgetCategories],
  );
  const totalActual = useMemo(
    () => budgetCategories.reduce((sum, c) => sum + c.actual, 0),
    [budgetCategories],
  );

  /** Lucide icon mapping for budget categories. */
  const categoryIconMap: Record<string, string> = {
    flight: "✈️",
    stay: "🏨",
    food: "🍜",
    activities: "🎯",
    transport: "🚗",
    shopping: "🛍️",
    other: "📌",
  };

  return (
    <WorkspacePage className={pageClass} aria-label={t.flexibleHunter.title}>
      {/* Date window slider */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>{t.flexibleHunter.dateRangeLabel}</h2>
        <div className={sliderSectionClass} data-testid="date-window-slider-section">
          <DateWindowRangeSlider
            minDate={minDate}
            maxDate={maxDate}
            start={sliderStart}
            end={sliderEnd}
            onChange={handleDateChange}
            ariaLabelStart={t.flexibleHunter.startLabel}
            ariaLabelEnd={t.flexibleHunter.endLabel}
          />
        </div>
      </div>

      {/* Total budget summary */}
      <div className={totalBudgetSectionClass} data-testid="total-budget-summary">
        <span className={totalBudgetLabelClass}>{t.flexibleHunter.totalBudgetLabel}</span>
        <BudgetProgressBar spent={totalActual} max={totalEstimated} heightClass="h-5" />
      </div>

      {/* Budget category grid */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>{t.flexibleHunter.budgetTitle}</h2>
        {budgetCategories.length > 0 ? (
          <div className={categoryGridClass} data-testid="budget-category-grid">
            {budgetCategories.map((cat) => (
              <BudgetCategoryCard
                key={cat.id}
                category={cat}
                onEdit={onBudgetEdit}
                iconName={categoryIconMap[cat.category.toLowerCase()] ?? "📌"}
              />
            ))}
          </div>
        ) : (
          <div className={emptyStateClass} data-testid="no-categories-empty">
            <span>📋</span>
            <span className={emptyStateTextClass}>{t.flexibleHunter.noCategoriesPlaceholder}</span>
          </div>
        )}
      </div>

      {/* What-if comparison */}
      <div className={whatIfSectionClass} data-testid="what-if-section">
        <h2 className={sectionTitleClass}>{t.flexibleHunter.whatIfTitle}</h2>
        <div className={whatIfRadioGroupClass} role="radiogroup" aria-label={t.flexibleHunter.whatIfTitle}>
          {WHAT_IF_OPTIONS.map((option) => {
            const isSelected = whatIf === option.value;
            const isDisabled = option.disabled ?? false;
            const shiftedDates =
              isSelected && option.shiftDays !== 0
                ? whatIfShifted
                : null;

            return (
              <label
                key={option.value}
                className={[
                  whatIfRadioClass,
                  isSelected && whatIfRadioSelectedClass,
                  isDisabled && whatIfRadioDisabledClass,
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-testid={`what-if-${option.value}`}
                aria-disabled={isDisabled}
              >
                <input
                  type="radio"
                  name="what-if"
                  value={option.value}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => setWhatIf(isSelected ? null : option.value)}
                  className={whatIfRadioInputClass}
                />
                <span>{whatIfLabels[option.value]}</span>
                {shiftedDates && (
                  <span className={whatIfShiftedLabelClass}>
                    {formatShort(shiftedDates.start)} → {formatShort(shiftedDates.end)}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </WorkspacePage>
  );
}

/** Return a 12-month window centered on the current month as a YYYY-MM-DD pair. */
function getDefaultWindowCentered(months: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - Math.floor(months / 2), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
