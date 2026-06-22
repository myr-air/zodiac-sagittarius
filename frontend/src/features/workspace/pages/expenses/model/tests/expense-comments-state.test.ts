import { describe, expect, it } from "vitest";
import type { ExpenseComment } from "@/src/trip/types";

import {
  addExpenseCommentFromDraft,
  expenseCommentDisplay,
  initialExpenseCommentsState,
  updateExpenseCommentDraft,
} from "../expense-comments-state";

const existingComments: ExpenseComment[] = [
  {
    authorId: "member-aom",
    body: "Receipt uploaded.",
    createdAt: "2026-06-19T00:00:00.000Z",
    id: "comment-existing",
  },
];

describe("expense comments state", () => {
  it("initializes from existing expense comments", () => {
    expect(initialExpenseCommentsState(existingComments)).toEqual({
      commentDraft: "",
      comments: existingComments,
    });
  });

  it("updates the comment draft without changing existing comments", () => {
    expect(
      updateExpenseCommentDraft(
        initialExpenseCommentsState(existingComments),
        "  I'll transfer tonight.  ",
      ),
    ).toEqual({
      commentDraft: "  I'll transfer tonight.  ",
      comments: existingComments,
    });
  });

  it("appends a draft comment and clears the draft", () => {
    const state = updateExpenseCommentDraft(
      initialExpenseCommentsState(existingComments),
      "  I'll transfer tonight.  ",
    );

    const nextState = addExpenseCommentFromDraft({
      authorId: "member-beam",
      state,
    });

    expect(nextState.commentDraft).toBe("");
    expect(nextState.comments).toHaveLength(2);
    expect(nextState.comments[1]).toMatchObject({
      authorId: "member-beam",
      body: "I'll transfer tonight.",
      id: "comment-local-1",
    });
  });

  it("keeps the same state when the draft is blank", () => {
    const state = updateExpenseCommentDraft(
      initialExpenseCommentsState(existingComments),
      "   ",
    );

    expect(
      addExpenseCommentFromDraft({
        authorId: "member-beam",
        state,
      }),
    ).toBe(state);
  });

  it("builds comment display author names with an unknown fallback", () => {
    expect(expenseCommentDisplay({
      comment: existingComments[0],
      members: [
        { color: "#0f766e", displayName: "Aom", id: "member-aom", presence: "online", role: "owner" },
      ],
      unknownAuthor: "Unknown traveler",
    })).toEqual({
      authorName: "Aom",
      body: "Receipt uploaded.",
      id: "comment-existing",
    });
    expect(expenseCommentDisplay({
      comment: {
        ...existingComments[0],
        authorId: "member-missing",
      },
      members: [],
      unknownAuthor: "Unknown traveler",
    }).authorName).toBe("Unknown traveler");
  });
});
