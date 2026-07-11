"use client";

import { cn } from "@/src/lib/cn";

export interface DaySwitcherStripProps {
  days: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
  dayLabels: Record<string, string>;
}

export function DaySwitcherStrip({ days, selectedDay, onSelectDay, dayLabels }: DaySwitcherStripProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Day switcher"
      data-testid="day-switcher-strip"
    >
      {days.map((day) => {
        const isSelected = day === selectedDay;
        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={isSelected}
            data-selected={isSelected ? "true" : undefined}
            data-testid={`day-chip-${day}`}
            onClick={() => onSelectDay(day)}
            className={cn(
              "h-12 min-w-[44px] rounded-(--radius-md) px-3 flex items-center justify-center cursor-pointer whitespace-nowrap text-sm font-medium transition-colors",
              isSelected
                ? "bg-(--color-primary) text-white"
                : "bg-(--color-surface) text-(--color-text-muted) hover:bg-(--color-surface-subtle)",
            )}
          >
            {dayLabels[day] ?? day}
          </button>
        );
      })}
    </div>
  );
}
