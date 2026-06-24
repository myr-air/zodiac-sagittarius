import { CopyFeedback } from "./CopyFeedback";
import {
  copyFeedbackLabel,
  type CopyFeedbackLabels,
} from "./copy-feedback-labels";
import type { CopyFeedbackState } from "./use-copy-feedback-state";

interface WorkspaceCopyFeedbackProps {
  "aria-label"?: string;
  className: string;
  labels: CopyFeedbackLabels;
  readOnly?: boolean;
  state: CopyFeedbackState;
}

export function workspaceCopyFeedbackLabel({
  labels,
  readOnly,
  state,
}: {
  labels: CopyFeedbackLabels;
  readOnly?: boolean;
  state: CopyFeedbackState;
}): string {
  return copyFeedbackLabel({ labels, readOnly, state });
}

export function WorkspaceCopyFeedback({
  "aria-label": ariaLabel,
  className,
  labels,
  readOnly,
  state,
}: WorkspaceCopyFeedbackProps) {
  return (
    <CopyFeedback
      aria-label={ariaLabel}
      className={className}
      state={state}
      label={workspaceCopyFeedbackLabel({ labels, readOnly, state })}
    />
  );
}
