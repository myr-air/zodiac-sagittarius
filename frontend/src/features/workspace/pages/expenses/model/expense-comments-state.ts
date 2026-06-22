import type { ExpenseComment } from "@/src/trip/types";
import { appendExpenseDialogComment } from "./expense-dialog-comments";

export interface ExpenseCommentsState {
  commentDraft: string;
  comments: ExpenseComment[];
}

export function initialExpenseCommentsState(
  comments: ExpenseComment[] | undefined,
): ExpenseCommentsState {
  return {
    commentDraft: "",
    comments: comments ?? [],
  };
}

export function updateExpenseCommentDraft(
  state: ExpenseCommentsState,
  commentDraft: string,
): ExpenseCommentsState {
  return { ...state, commentDraft };
}

export function addExpenseCommentFromDraft({
  authorId,
  state,
}: {
  authorId: string;
  state: ExpenseCommentsState;
}): ExpenseCommentsState {
  const comments = appendExpenseDialogComment({
    authorId,
    comments: state.comments,
    draft: state.commentDraft,
  });
  return comments === state.comments
    ? state
    : {
        commentDraft: "",
        comments,
      };
}
