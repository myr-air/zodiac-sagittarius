import { describe, expect, it } from "vitest";
import { appendExpenseDialogComment } from "../expense-dialog-comments";

describe("expense dialog comments", () => {
  it("appends a trimmed local comment with author and timestamp", () => {
    expect(appendExpenseDialogComment({
      authorId: "member-aom",
      comments: [],
      draft: "  I'll transfer tonight.  ",
      now: () => new Date("2026-06-20T12:30:00.000Z"),
    })).toEqual([
      {
        id: "comment-local-1",
        authorId: "member-aom",
        body: "I'll transfer tonight.",
        createdAt: "2026-06-20T12:30:00.000Z",
      },
    ]);
  });

  it("uses the next local comment id after existing comments", () => {
    expect(appendExpenseDialogComment({
      authorId: "member-beam",
      comments: [
        {
          id: "comment-local-1",
          authorId: "member-aom",
          body: "Existing",
          createdAt: "2026-06-19T00:00:00.000Z",
        },
      ],
      draft: "Second",
      now: () => new Date("2026-06-20T00:00:00.000Z"),
    })[1]).toMatchObject({
      id: "comment-local-2",
      authorId: "member-beam",
      body: "Second",
    });
  });

  it("returns the original comments when the draft is blank", () => {
    const comments = [
      {
        id: "comment-existing",
        authorId: "member-aom",
        body: "Existing",
        createdAt: "2026-06-19T00:00:00.000Z",
      },
    ];

    expect(appendExpenseDialogComment({
      authorId: "member-aom",
      comments,
      draft: "   ",
    })).toBe(comments);
  });
});
