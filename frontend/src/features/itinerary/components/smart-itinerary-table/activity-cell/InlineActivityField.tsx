import { useState } from "react";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  initialInlineActivityFieldState,
  updateInlineActivityFieldDraft,
} from "./inline-activity-field-state";
import { useInlineActivityFieldActions } from "./use-inline-activity-field-actions";

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
  const actions = useInlineActivityFieldActions({
    disabled,
    onCommit,
    setState,
    state,
  });

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
      onBlur={() => void actions.commit(state.draft)}
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
          actions.reset();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
