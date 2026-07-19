"use client";

import { canStartPlanning } from "@/src/landing/plan-query";

type PlanQueryBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

export function PlanQueryBar({
  query,
  onQueryChange,
  onSubmit,
  inputRef,
}: PlanQueryBarProps) {
  const enabled = canStartPlanning(query);

  return (
    <form
      className="mx-auto flex w-full max-w-[640px] flex-col items-stretch gap-2 rounded-(--radius-lg) bg-(--color-surface) p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-[18px]"
      action="#create"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        if (!enabled) {
          inputRef?.current?.focus();
          return;
        }
        onSubmit();
      }}
    >
      <svg
        className="hidden shrink-0 text-(--color-text-subtle) sm:block"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16.5 16.5 21 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        ref={inputRef}
        id="query"
        name="to"
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Destination or places"
        autoComplete="off"
        required
        aria-required="true"
        className="min-h-11 min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-(--color-text) outline-none placeholder:font-normal placeholder:text-(--color-text-subtle)"
      />
      <button
        type="submit"
        disabled={!enabled}
        className="landing-control shrink-0 rounded-full bg-(--color-primary) px-[22px] py-0 text-sm font-bold text-white transition-colors duration-[180ms] hover:bg-(--color-primary-strong) disabled:cursor-not-allowed disabled:opacity-45 min-h-11 w-full sm:w-auto"
      >
        Start Planning
      </button>
    </form>
  );
}
