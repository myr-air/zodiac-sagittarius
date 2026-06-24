import {
  WorkspaceCopyFeedback,
  commonCopyFeedbackLabels,
  workspaceCopyFeedbackLabel,
  type CopyFeedbackLabels,
} from "@/src/shared/components/copy-feedback";
import * as memberStyles from "../TripMembersPage.styles";
import type { MemberCopyState, MemberLabels } from "./member-management.types";

function memberCopyFeedbackLabels(labels: MemberLabels): CopyFeedbackLabels {
  return commonCopyFeedbackLabels({
    readOnly: labels.members.copy.readOnly,
    ready: labels.members.copy.ready,
    status: labels.common.status,
  });
}

export function memberCopyFeedbackLabel({
  copyState,
  labels,
  readOnly,
}: {
  copyState: MemberCopyState;
  labels: MemberLabels;
  readOnly?: boolean;
}): string {
  return workspaceCopyFeedbackLabel({
    labels: memberCopyFeedbackLabels(labels),
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
    <WorkspaceCopyFeedback
      className={memberStyles.copyFeedbackClassName}
      state={copyState}
      readOnly={readOnly}
      labels={memberCopyFeedbackLabels(labels)}
    />
  );
}
