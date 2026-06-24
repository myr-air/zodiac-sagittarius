import type { ExpenseComment, Member } from "@/src/trip/types";
import { Button } from "@/src/ui";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseCommentDisplay } from "../model/expense-comments-state";

interface ExpenseCommentsSectionProps {
  comments: ExpenseComment[];
  commentDraft: string;
  members: Member[];
  copy: {
    actions: {
      addComment: string;
    };
    comment: {
      empty: string;
      unknownAuthor: string;
    };
    fields: {
      commentInput: string;
      comments: string;
    };
  };
  onAddComment: () => void;
  onCommentDraftChange: (value: string) => void;
}

export function ExpenseCommentsSection({
  comments,
  commentDraft,
  members,
  copy,
  onAddComment,
  onCommentDraftChange,
}: ExpenseCommentsSectionProps) {
  return (
    <section className={expenseStyles.commentsClassName} aria-label={copy.fields.comments}>
      <div className={expenseStyles.balanceListClassName}>
        {comments.map((comment) => {
          const display = expenseCommentDisplay({
            comment,
            members,
            unknownAuthor: copy.comment.unknownAuthor,
          });
          return (
            <div className={expenseStyles.commentRowClassName} key={display.id}>
              <strong>{display.authorName}</strong>
              <span>{display.body}</span>
            </div>
          );
        })}
        {!comments.length ? <p className={expenseStyles.balanceMetaClassName}>{copy.comment.empty}</p> : null}
      </div>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.commentInput}</span>
        <textarea value={commentDraft} onChange={(event) => onCommentDraftChange(event.target.value)} />
      </label>
      <Button type="button" variant="ghost" onClick={onAddComment}>{copy.actions.addComment}</Button>
    </section>
  );
}
