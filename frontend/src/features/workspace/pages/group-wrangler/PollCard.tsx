import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { ActivityPoll } from "@/src/trip/polls";

interface PollCardProps {
  activityName: string;
  poll: ActivityPoll;
  currentMemberId: string;
  disabled: boolean;
  onVote?: (optionId: string) => void;
  voteCountLabel: (count: number) => string;
  tieLabel: string;
  voteButton: string;
}

export function PollCard({
  activityName,
  poll,
  currentMemberId,
  disabled,
  onVote,
  voteCountLabel,
  tieLabel,
  voteButton,
}: PollCardProps) {
  const maxCount = Math.max(0, ...poll.options.map((option) => countVotes(poll, option.id)));
  const leadingOptionIds = new Set(
    poll.options
      .filter((option) => countVotes(poll, option.id) === maxCount && maxCount > 0)
      .map((option) => option.id),
  );
  const isTie = leadingOptionIds.size > 1;
  const hasVoted = poll.votes.some((vote) => vote.memberId === currentMemberId);

  return (
    <div
      className={cn(
        "rounded-(--radius-md) border border-(--color-border-strong) p-4 bg-(--color-surface)",
        !disabled && onVote && "cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold text-(--color-text)">{activityName}</h3>
        {isTie && (
          <span className="inline-flex items-center rounded-(--radius-md) bg-(--color-primary-soft) px-2 py-0.5 text-xs font-medium text-(--color-primary-strong)">
            {tieLabel}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {poll.options.map((option) => {
          const count = countVotes(poll, option.id);
          const isLeading = leadingOptionIds.has(option.id);
          const isVotedByCurrentMember = poll.votes.some(
            (vote) => vote.memberId === currentMemberId && vote.selectedOptionId === option.id,
          );
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || !onVote}
              className={cn(
                "w-full text-left rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2 transition-colors",
                !disabled && onVote && "hover:bg-(--color-surface-subtle)",
                disabled && "cursor-default",
              )}
              onClick={() => onVote?.(option.id)}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="flex items-center gap-2 text-sm font-medium text-(--color-text)">
                  {option.label}
                  {isVotedByCurrentMember && <Icon name="check" className="text-(--color-primary)" />}
                </span>
                <span className="text-sm text-(--color-text-muted) [font-variant-numeric:tabular-nums]">
                  {voteCountLabel(count)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-(--color-border-strong)">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    isLeading ? "bg-(--color-primary)" : "bg-(--color-border-strong)",
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              {!hasVoted && !disabled && onVote && (
                <span className="sr-only">{voteButton}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function countVotes(poll: ActivityPoll, optionId: string): number {
  return poll.votes.filter((vote) => vote.selectedOptionId === optionId).length;
}
