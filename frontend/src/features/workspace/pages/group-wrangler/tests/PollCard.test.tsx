import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { PollCard } from "../PollCard";
import type { ActivityPoll } from "@/src/trip/polls";

function makePoll(overrides: Partial<ActivityPoll> = {}): ActivityPoll {
  return {
    id: "poll-1",
    activityId: "activity-1",
    isOpen: true,
    createdBy: "member-1",
    options: [
      { id: "opt-1", label: "Morning", sortOrder: 0 },
      { id: "opt-2", label: "Afternoon", sortOrder: 1 },
    ],
    votes: [],
    ...overrides,
  };
}

describe("PollCard", () => {
  const baseProps = {
    activityName: "Hiking",
    currentMemberId: "member-1",
    disabled: false,
    voteCountLabel: (count: number) => `${count} votes`,
    tieLabel: "Tie",
    voteButton: "Vote",
  };

  it("renders poll options with vote bars", () => {
    renderWithI18n(<PollCard {...baseProps} poll={makePoll()} />, { locale: "en" });

    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("Afternoon")).toBeInTheDocument();
    expect(screen.getAllByText("0 votes")).toHaveLength(2);
  });

  it("shows leading option with teal bar", () => {
    const poll = makePoll({
      votes: [
        { activityId: "activity-1", memberId: "member-1", selectedOptionId: "opt-1", votedAt: "2026-07-11T00:00:00Z" },
        { activityId: "activity-1", memberId: "member-2", selectedOptionId: "opt-1", votedAt: "2026-07-11T00:00:00Z" },
      ],
    });
    renderWithI18n(<PollCard {...baseProps} poll={poll} />, { locale: "en" });

    const bars = document.querySelectorAll(".h-2.rounded-full > div");
    expect(bars.length).toBe(2);
    expect(bars[0]).toHaveClass("bg-(--color-primary)");
    expect(bars[1]).toHaveClass("bg-(--color-border-strong)");
  });

  it("shows tie state with tie badge", () => {
    const poll = makePoll({
      votes: [
        { activityId: "activity-1", memberId: "member-1", selectedOptionId: "opt-1", votedAt: "2026-07-11T00:00:00Z" },
        { activityId: "activity-1", memberId: "member-2", selectedOptionId: "opt-2", votedAt: "2026-07-11T00:00:00Z" },
      ],
    });
    renderWithI18n(<PollCard {...baseProps} poll={poll} />, { locale: "en" });

    expect(screen.getByText("Tie")).toBeInTheDocument();
    const bars = document.querySelectorAll(".h-2.rounded-full > div");
    expect(bars[0]).toHaveClass("bg-(--color-primary)");
    expect(bars[1]).toHaveClass("bg-(--color-primary)");
  });

  it("clicking an option calls onVote", () => {
    const onVote = vi.fn();
    renderWithI18n(<PollCard {...baseProps} poll={makePoll()} onVote={onVote} />, { locale: "en" });

    fireEvent.click(screen.getByText("Morning"));
    expect(onVote).toHaveBeenCalledWith("opt-1");
  });

  it("disabled state prevents clicks", () => {
    const onVote = vi.fn();
    renderWithI18n(<PollCard {...baseProps} poll={makePoll()} onVote={onVote} disabled={true} />, { locale: "en" });

    fireEvent.click(screen.getByText("Morning"));
    expect(onVote).not.toHaveBeenCalled();
  });

  it("shows check icon on voted option", () => {
    const poll = makePoll({
      votes: [
        { activityId: "activity-1", memberId: "member-1", selectedOptionId: "opt-1", votedAt: "2026-07-11T00:00:00Z" },
      ],
    });
    renderWithI18n(<PollCard {...baseProps} poll={poll} />, { locale: "en" });

    const morningRow = screen.getByText("Morning").closest("button");
    expect(morningRow?.querySelector("svg")).toBeInTheDocument();
  });

  it("uses tabular numerals on vote counts", () => {
    renderWithI18n(<PollCard {...baseProps} poll={makePoll()} />, { locale: "en" });

    const voteCounts = screen.getAllByText("0 votes");
    expect(voteCounts.length).toBeGreaterThan(0);
    voteCounts.forEach((voteCount) => {
      expect(voteCount).toHaveClass("[font-variant-numeric:tabular-nums]");
    });
  });
});
