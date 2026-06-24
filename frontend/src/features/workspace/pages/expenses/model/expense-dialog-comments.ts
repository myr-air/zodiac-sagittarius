import { nextLocalExpenseCommentId } from "@/src/trip/identity";
import type { ExpenseComment } from "@/src/trip/types";

export function appendExpenseDialogComment({
  authorId,
  comments,
  draft,
  now = () => new Date(),
}: {
  authorId: string;
  comments: ExpenseComment[];
  draft: string;
  now?: () => Date;
}): ExpenseComment[] {
  const body = draft.trim();
  if (!body) return comments;
  return [
    ...comments,
    {
      id: nextLocalExpenseCommentId(comments),
      authorId,
      body,
      createdAt: now().toISOString(),
    },
  ];
}
