import { useState } from "react";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  commitInlineActivityFieldDraft,
  initialInlineActivityFieldState,
  resetInlineActivityFieldDraft,
  updateInlineActivityFieldDraft,
} from "./inline-activity-field-state";

export function InlineActivityField({
  ariaLabel,
  autoSize = false,
  className,
  disabled,
  inputMode,
  maxLength,
  onCommit,
  placeholder,
  value,
}: {
  ariaLabel: string;
  autoSize?: boolean;
  className: string;
  disabled: boolean;
  inputMode?: "numeric" | "text";
  maxLength: number;
  onCommit: (value: string) => ItineraryAsyncVoidResult;
  placeholder: string;
  value: string;
}) {
  const [state, setState] = useState(() =>
    initialInlineActivityFieldState(value),
  );

  function reset() {
    setState((current) => resetInlineActivityFieldDraft(current));
  }

  async function commit(nextValue: string) {
    const trimmed = nextValue.trim();
    if (disabled || trimmed === state.source) {
      setState((current) => resetInlineActivityFieldDraft(current));
      return;
    }
    await onCommit(trimmed);
    setState(commitInlineActivityFieldDraft(trimmed));
  }

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
      placeholder={placeholder}
      size={
        autoSize
          ? Math.max(
              1,
              Math.min(maxLength, state.draft.length || placeholder.length || 1),
            )
          : undefined
      }
      value={state.draft}
      onBlur={() => void commit(state.draft)}
      onChange={(event) =>
        setState((current) =>
          updateInlineActivityFieldDraft(current, event.target.value),
        )
      }
      onClick={(event) => event.stopPropagation()}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          reset();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
