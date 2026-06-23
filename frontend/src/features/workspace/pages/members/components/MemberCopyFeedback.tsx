import { CopyFeedback } from "@/src/shared/components/copy-feedback";
import * as memberStyles from "../TripMembersPage.styles";
import type { MemberCopyState, MemberLabels } from "./member-management.types";

export function memberCopyFeedbackLabel({
  copyState,
  labels,
  readOnly,
}: {
  copyState: MemberCopyState;
  labels: MemberLabels;
  readOnly?: boolean;
}): string {
  if (readOnly) return labels.members.copy.readOnly;
  if (copyState === "copied") return labels.common.status.copied;
  if (copyState === "error") return labels.common.status.copyFailed;
  return labels.members.copy.ready;
}

interface MemberCopyFeedbackProps {
  copyState: MemberCopyState;
  labels: MemberLabels;
  readOnly?: boolean;
}

export function MemberCopyFeedback({
  copyState,
  labels,
  readOnly,
}: MemberCopyFeedbackProps) {
  return (
    <CopyFeedback
      className={memberStyles.copyFeedbackClassName}
      state={copyState}
      label={memberCopyFeedbackLabel({ copyState, labels, readOnly })}
    />
  );
}
