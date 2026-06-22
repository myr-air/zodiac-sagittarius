import { useState } from "react";
import type { Expense, Member } from "@/src/trip/types";
import {
  addExpenseCommentFromDraft,
  initialExpenseCommentsState,
  updateExpenseCommentDraft,
} from "../model/expense-comments-state";

interface UseExpenseCommentsInput {
  currentMember: Member;
  expense: Expense | null;
}

export function useExpenseComments({
  currentMember,
  expense,
}: UseExpenseCommentsInput) {
  const [state, setState] = useState(() =>
    initialExpenseCommentsState(expense?.comments),
  );

  function addComment() {
    setState((current) =>
      addExpenseCommentFromDraft({
        authorId: currentMember.id,
        state: current,
      }),
    );
  }

  return {
    addComment,
    commentDraft: state.commentDraft,
    comments: state.comments,
    setCommentDraft: (commentDraft: string) =>
      setState((current) => updateExpenseCommentDraft(current, commentDraft)),
  };
}
