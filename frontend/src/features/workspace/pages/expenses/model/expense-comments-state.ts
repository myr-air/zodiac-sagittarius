import { findMemberById } from "@/src/trip/members";
import { displayNameOrFallback } from "@/src/shared/text-parts";
import type { ExpenseComment, Member } from "@/src/trip/types";
import { appendExpenseDialogComment } from "./expense-dialog-comments";

export interface ExpenseCommentsState {
  commentDraft: string;
  comments: ExpenseComment[];
}

export interface ExpenseCommentDisplay {
  authorName: string;
  body: string;
  id: string;
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

export function expenseCommentDisplay({
  comment,
  members,
  unknownAuthor,
}: {
  comment: ExpenseComment;
  members: Member[];
  unknownAuthor: string;
}): ExpenseCommentDisplay {
  const author = findMemberById(members, comment.authorId);
  return {
    authorName: displayNameOrFallback(author, unknownAuthor),
    body: comment.body,
    id: comment.id,
  };
}
