import { useState } from "react";
import { nextLocalExpenseCommentId } from "@/src/trip/identity";
import type { Expense, ExpenseComment, Member } from "@/src/trip/types";

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
    const body = commentDraft.trim();
    if (!body) return;
    setComments((current) => [
      ...current,
      {
        id: nextLocalExpenseCommentId(current),
        authorId: currentMember.id,
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCommentDraft("");
  }

  return {
    addComment,
    commentDraft,
    comments,
    setCommentDraft,
  };
}
