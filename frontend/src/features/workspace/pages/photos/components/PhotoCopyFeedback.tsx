import {
  CopyFeedback,
  copyFeedbackLabel,
  type CopyFeedbackState,
} from "@/src/shared/components/copy-feedback";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";

export function photoCopyFeedbackLabel({
  copy,
  copyState,
}: {
  copy: PhotoCopy;
  copyState: CopyFeedbackState;
}): string {
  return copyFeedbackLabel({
    labels: {
      copied: copy.copied,
      error: copy.copyError,
      ready: copy.copyError,
    },
    state: copyState,
  });
}

interface PhotoCopyFeedbackProps {
  copy: PhotoCopy;
  copyState: Exclude<CopyFeedbackState, "idle">;
}

export function PhotoCopyFeedback({ copy, copyState }: PhotoCopyFeedbackProps) {
  return (
    <CopyFeedback
      className={photoStyles.copyFeedbackClassName}
      state={copyState}
      aria-label={copy.copyStatusLabel}
      label={photoCopyFeedbackLabel({ copy, copyState })}
    />
  );
}
