import type { CopyFeedbackState } from "./use-copy-feedback-state";

export interface CopyFeedbackLabels {
  copied: string;
  error: string;
  readOnly?: string;
  ready: string;
}

export interface CommonCopyFeedbackStatusLabels {
  copied: string;
  copyFailed: string;
}

export function commonCopyFeedbackLabels({
  readOnly,
  ready,
  status,
}: {
  readOnly?: string;
  ready: string;
  status: CommonCopyFeedbackStatusLabels;
}): CopyFeedbackLabels {
  return {
    copied: status.copied,
    error: status.copyFailed,
    readOnly,
    ready,
  };
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
