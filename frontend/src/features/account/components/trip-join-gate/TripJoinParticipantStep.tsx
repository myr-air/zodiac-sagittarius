import { Fragment, type FormEvent } from "react";
import type { Messages } from "@/src/i18n/messages";
import { cn } from "@/src/lib/cn";
import { isTripParticipantDisabled } from "@/src/trip/auth";
import { memberInitial, roleLabel } from "@/src/trip/member-labels";
import type { Member } from "@/src/trip/types";
import { Badge } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import {
  TripJoinParticipantAuthForm,
  type TripJoinParticipantAuthFormCopy,
} from "./TripJoinParticipantAuthForm";
import { participantStatusLabel } from "./trip-join-gate.support";
import {
  participantAvatarClassName,
  participantCardClassName,
  participantGridClassName,
  participantStepClassName,
  tripAccessContentClassName,
  tripAccessParticipantStepClassName,
} from "./trip-join-gate.styles";

interface TripJoinParticipantStepCopy extends TripJoinParticipantAuthFormCopy {
  backToRoom: string;
  memberStatus: Messages["join"]["memberStatus"];
  participantListLabel: string;
  roles: Messages["appShell"]["roles"];
}

interface TripJoinParticipantStepProps {
  copy: TripJoinParticipantStepCopy;
  isSubmitting: boolean;
  isTripAccessVariant: boolean;
  participantMembers: Member[];
  participantPassword: string;
  selectedMember: Member | null;
  selectedMemberId: string | null;
  showParticipantPassword: boolean;
  onBackToRoom: () => void;
  onParticipantPasswordChange: (value: string) => void;
  onSelectMember: (member: Member) => void;
  onSubmitParticipant: (event: FormEvent<HTMLFormElement>) => void;
  onToggleParticipantPassword: () => void;
}

export function TripJoinParticipantStep({
  copy,
  isSubmitting,
  isTripAccessVariant,
  participantMembers,
  participantPassword,
  selectedMember,
  selectedMemberId,
  showParticipantPassword,
  onBackToRoom,
  onParticipantPasswordChange,
  onSelectMember,
  onSubmitParticipant,
  onToggleParticipantPassword,
}: TripJoinParticipantStepProps) {
  return (
    <div
      className={cn(
        participantStepClassName,
        isTripAccessVariant ? tripAccessContentClassName : "",
        isTripAccessVariant ? tripAccessParticipantStepClassName : "",
      )}
    >
      <button
        type="button"
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 py-1.5 text-xs font-[850] text-(--color-text-muted) transition-all duration-150 hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) hover:border-(--color-primary-border) hover:shadow-[0_8px_18px_rgb(194_79_22_/_0.08)] focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-route) focus-visible:border-(--color-route-border)"
        )}
        onClick={onBackToRoom}
      >
        <Icon name="chevronLeft" className="size-3.5" />
        {copy.backToRoom}
      </button>
      <div
        className={participantGridClassName}
        role="group"
        aria-label={copy.participantListLabel}
      >
        {participantMembers.map((member) => (
          <Fragment key={member.id}>
            <button
              className={participantCardClassName}
              disabled={isTripParticipantDisabled(member)}
              data-selected={member.id === selectedMemberId ? "true" : "false"}
              type="button"
              onClick={() => onSelectMember(member)}
            >
              <span
                className={participantAvatarClassName}
                style={{ backgroundColor: member.color }}
                aria-hidden="true"
              >
                {memberInitial(member.displayName)}
              </span>
              <span>
                <strong>{member.displayName}</strong>
                <small>{roleLabel(member.role, copy.roles)}</small>
              </span>
              <Badge
                tone={
                  isTripParticipantDisabled(member)
                    ? "danger"
                    : member.userId || member.claimPasswordHash || member.claimedAt
                      ? "success"
                      : "warning"
                }
              >
                {participantStatusLabel(member, copy.memberStatus)}
              </Badge>
            </button>
            {selectedMember?.id === member.id ? (
              <TripJoinParticipantAuthForm
                copy={copy}
                isSubmitting={isSubmitting}
                isTripAccessVariant={isTripAccessVariant}
                participantPassword={participantPassword}
                selectedMember={selectedMember}
                showParticipantPassword={showParticipantPassword}
                onParticipantPasswordChange={onParticipantPasswordChange}
                onSubmitParticipant={onSubmitParticipant}
                onToggleParticipantPassword={onToggleParticipantPassword}
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
