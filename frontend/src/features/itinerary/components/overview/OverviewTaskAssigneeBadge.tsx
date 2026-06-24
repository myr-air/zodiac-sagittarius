import type { Trip, TripTask } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { PersonAvatar } from "@/src/shared/components/person-avatar";
import { displayNameOrFallback } from "@/src/shared/text-parts";
import { findMemberById } from "@/src/trip/members";
import { overviewTaskMetaClassName } from "./overview.styles";

export interface TaskAssigneeLabels {
  private: string;
  shared: string;
  tripMember: string;
  unassigned: string;
}

export function TaskAssigneeBadge({
  task,
  trip,
  labels,
}: {
  task: TripTask;
  trip: Trip;
  labels: TaskAssigneeLabels;
}) {
  const isPrivate = task.visibility === "private";
  const member = findMemberById(trip.members, task.assigneeId) ?? null;
  const name = displayNameOrFallback(member, labels.tripMember);
  const color = member?.color ?? "var(--color-text-subtle)";

  return (
    <div className={overviewTaskMetaClassName}>
      <small
        className={cn(
          "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-bold",
          isPrivate
            ? "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)"
            : "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)",
        )}
      >
        {isPrivate ? labels.private : labels.shared}
      </small>

      {task.visibility !== "private" &&
        (task.assigneeId ? (
          <div className="inline-flex items-center gap-1">
            <PersonAvatar
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
              color={color}
              name={name}
              title={name}
            />
            <span className="text-[11px] font-bold text-(--color-text-muted) max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
              {name}
            </span>
          </div>
        ) : (
          <small className="inline-flex items-center rounded-sm border border-(--color-border) bg-(--color-surface-subtle) px-1.5 py-0.5 text-[10px] font-bold text-(--color-text-muted)">
            {labels.unassigned}
          </small>
        ))}
    </div>
  );
}
