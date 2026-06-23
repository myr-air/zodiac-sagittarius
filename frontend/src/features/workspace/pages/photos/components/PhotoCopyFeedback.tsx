import type { CopyFeedbackState } from "@/src/shared/components/copy-feedback";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";

export function photoCopyFeedbackLabel({
  copy,
  copyState,
}: {
  copy: PhotoCopy;
  copyState: CopyFeedbackState;
}): string {
  return copyState === "copied" ? copy.copied : copy.copyError;
}

interface PhotoCopyFeedbackProps {
  copy: PhotoCopy;
  copyState: Exclude<CopyFeedbackState, "idle">;
}

export function PhotoCopyFeedback({ copy, copyState }: PhotoCopyFeedbackProps) {
  return (
    <span
      className={photoStyles.copyFeedbackClassName}
      data-state={copyState}
      role="status"
      aria-label={copy.copyStatusLabel}
    >
      {photoCopyFeedbackLabel({ copy, copyState })}
    </span>
  );
}
