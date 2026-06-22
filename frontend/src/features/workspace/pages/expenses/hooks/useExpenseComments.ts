import { useState } from "react";
import type { Expense, ExpenseComment, Member } from "@/src/trip/types";
import { appendExpenseDialogComment } from "../model/expense-dialog-comments";

interface UseExpenseCommentsInput {
  currentMember: Member;
  expense: Expense | null;
}

export function useExpenseComments({
  currentMember,
  expense,
}: UseExpenseCommentsInput) {
  const [comments, setComments] = useState<ExpenseComment[]>(
    expense?.comments ?? [],
  );
  const [commentDraft, setCommentDraft] = useState("");

  function addComment() {
    if (!commentDraft.trim()) return;
    setComments((current) =>
      appendExpenseDialogComment({
        authorId: currentMember.id,
        comments: current,
        draft: commentDraft,
      }),
    );
    setCommentDraft("");
  }

  return {
    addComment,
    commentDraft,
    comments,
    setCommentDraft,
  };
}
