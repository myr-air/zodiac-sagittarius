import {
  CopyFeedback,
  copyFeedbackLabel,
} from "@/src/shared/components/copy-feedback";
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
  return copyFeedbackLabel({
    labels: {
      copied: labels.common.status.copied,
      error: labels.common.status.copyFailed,
      readOnly: labels.members.copy.readOnly,
      ready: labels.members.copy.ready,
    },
    readOnly,
    state: copyState,
  });
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
