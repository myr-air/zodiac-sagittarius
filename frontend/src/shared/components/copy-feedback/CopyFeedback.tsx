import type { CopyFeedbackState } from "./use-copy-feedback-state";

interface CopyFeedbackProps {
  "aria-label"?: string;
  className: string;
  label: string;
  state: CopyFeedbackState;
}

export function CopyFeedback({
  "aria-label": ariaLabel,
  className,
  label,
  state,
}: CopyFeedbackProps) {
  return (
    <span
      className={className}
      data-state={state}
      role="status"
      aria-label={ariaLabel}
    >
      {label}
    </span>
  );
}
