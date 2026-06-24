import {
  WorkspaceCopyFeedback,
  workspaceCopyFeedbackLabel,
  type CopyFeedbackLabels,
  type CopyFeedbackState,
} from "@/src/shared/components/copy-feedback";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";

function photoCopyFeedbackLabels(copy: PhotoCopy): CopyFeedbackLabels {
  return {
    copied: copy.copied,
    error: copy.copyError,
    ready: copy.copyError,
  };
}

export function photoCopyFeedbackLabel({
  copy,
  copyState,
}: {
  copy: PhotoCopy;
  copyState: CopyFeedbackState;
}): string {
  return workspaceCopyFeedbackLabel({
    labels: photoCopyFeedbackLabels(copy),
    state: copyState,
  });
}

interface PhotoCopyFeedbackProps {
  copy: PhotoCopy;
  copyState: Exclude<CopyFeedbackState, "idle">;
}

export function PhotoCopyFeedback({ copy, copyState }: PhotoCopyFeedbackProps) {
  return (
    <WorkspaceCopyFeedback
      className={photoStyles.copyFeedbackClassName}
      state={copyState}
      aria-label={copy.copyStatusLabel}
      labels={photoCopyFeedbackLabels(copy)}
    />
  );
}
