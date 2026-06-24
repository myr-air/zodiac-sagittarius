import type { CopyFeedbackState } from "./use-copy-feedback-state";

export interface CopyFeedbackLabels {
  copied: string;
  error: string;
  readOnly?: string;
  ready: string;
}

export function copyFeedbackLabel({
  labels,
  readOnly,
  state,
}: {
  labels: CopyFeedbackLabels;
  readOnly?: boolean;
  state: CopyFeedbackState;
}): string {
  if (readOnly && labels.readOnly) return labels.readOnly;
  if (state === "copied") return labels.copied;
  if (state === "error") return labels.error;
  return labels.ready;
}
