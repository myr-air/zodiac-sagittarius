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
    <span
      className={memberStyles.copyFeedbackClassName}
      data-state={copyState}
      role="status"
    >
      {memberCopyFeedbackLabel({ copyState, labels, readOnly })}
    </span>
  );
}
