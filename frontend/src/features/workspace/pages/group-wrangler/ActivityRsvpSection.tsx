import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";
import { PersonAvatar } from "@/src/shared/components/person-avatar";
import type { Member } from "@/src/trip/members/member-types";
import type { ActivityRsvp, RsvpStatus } from "@/src/trip/rsvp";

interface ActivityRsvpSectionProps {
  activityName: string;
  rsvps: ActivityRsvp[];
  members: Member[];
  currentMemberId: string;
  headcountLabel: (going: number, total: number) => string;
  goingLabel: string;
  notGoingLabel: string;
  onToggleRsvp?: (status: RsvpStatus) => void;
}

export function ActivityRsvpSection({
  activityName,
  rsvps,
  members,
  currentMemberId,
  headcountLabel,
  goingLabel,
  notGoingLabel,
  onToggleRsvp,
}: ActivityRsvpSectionProps) {
  const goingCount = rsvps.filter((r) => r.status === "going").length;
  const totalCount = rsvps.length;

  if (rsvps.length === 0) {
    return (
      <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4">
        <h3 className="font-semibold text-(--color-text)">{activityName}</h3>
        <p className="mt-2 text-sm text-(--color-text-muted)">{headcountLabel(0, 0)}</p>
      </div>
    );
  }

  const currentRsvp = rsvps.find((r) => r.memberId === currentMemberId);

  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold text-(--color-text)">{activityName}</h3>
        <span className="text-sm text-(--color-text-muted)">
          {headcountLabel(goingCount, totalCount)}
        </span>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {rsvps.map((rsvp) => {
          const member = members.find((m) => m.id === rsvp.memberId);
          if (!member) return null;
          return (
            <div key={rsvp.memberId} className="flex items-center gap-3">
              <div className="w-8 h-8">
                <PersonAvatar
                  color={member.color}
                  name={member.displayName ?? member.id}
                  title={member.displayName}
                  className="w-full h-full"
                />
              </div>
              <span className="text-sm text-(--color-text)">{member.displayName ?? member.id}</span>
              <span
                className={cn(
                  "ml-auto text-sm font-medium",
                  rsvp.status === "going" ? "text-(--color-primary)" : "text-(--color-text-muted)",
                )}
              >
                {rsvp.status === "going" ? goingLabel : notGoingLabel}
              </span>
            </div>
          );
        })}
      </div>
      {onToggleRsvp && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={currentRsvp?.status === "going" ? "primary" : "secondary"}
            className="flex-1 min-h-10"
            aria-pressed={currentRsvp?.status === "going"}
            onClick={() => onToggleRsvp("going")}
          >
            {goingLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "flex-1 min-h-10",
              currentRsvp?.status === "not-going" && "bg-(--color-border-strong) text-white",
            )}
            aria-pressed={currentRsvp?.status === "not-going"}
            onClick={() => onToggleRsvp("not-going")}
          >
            {notGoingLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
