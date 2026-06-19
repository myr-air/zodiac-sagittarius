import { Fragment, type FormEvent } from "react";
import type { Messages } from "@/src/i18n/messages";
import { cn } from "@/src/lib/cn";
import { isTripParticipantDisabled } from "@/src/trip/auth";
import type { Member } from "@/src/trip/types";
import { Badge, Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { participantStatusLabel, roleLabel } from "./trip-join-gate.support";
import {
  joinSubmitClassName,
  participantAuthClassName,
  participantAuthHelpClassName,
  participantAvatarClassName,
  participantCardClassName,
  participantGridClassName,
  participantStepClassName,
  passwordInputRowClassName,
  passwordVisibilityButtonClassName,
  tripAccessContentClassName,
  tripAccessParticipantStepClassName,
  tripAccessSubmitClassName,
} from "./trip-join-gate.styles";

interface TripJoinParticipantStepCopy {
  backToRoom: string;
  confirm: string;
  hideParticipantPassword: string;
  memberStatus: Messages["join"]["memberStatus"];
  participantHelp: string;
  participantListLabel: string;
  participantPassword: (params: { name: string }) => string;
  roles: Messages["appShell"]["roles"];
  setParticipantPassword: (params: { name: string }) => string;
  showParticipantPassword: string;
  start: string;
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
    <div className={cn(participantStepClassName, isTripAccessVariant ? tripAccessContentClassName : "", isTripAccessVariant ? tripAccessParticipantStepClassName : "")}>
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
      <div className={participantGridClassName} role="group" aria-label={copy.participantListLabel}>
        {participantMembers.map((member) => (
          <Fragment key={member.id}>
            <button
              className={participantCardClassName}
              disabled={isTripParticipantDisabled(member)}
              data-selected={member.id === selectedMemberId ? "true" : "false"}
              type="button"
              onClick={() => onSelectMember(member)}
            >
              <span className={participantAvatarClassName} style={{ backgroundColor: member.color }} aria-hidden="true">
                {member.displayName.slice(0, 1)}
              </span>
              <span>
                <strong>{member.displayName}</strong>
                <small>{roleLabel(member.role, copy.roles)}</small>
              </span>
              <Badge tone={isTripParticipantDisabled(member) ? "danger" : (member.userId || member.claimPasswordHash || member.claimedAt) ? "success" : "warning"}>
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

interface TripJoinParticipantAuthFormProps {
  copy: TripJoinParticipantStepCopy;
  isSubmitting: boolean;
  isTripAccessVariant: boolean;
  participantPassword: string;
  selectedMember: Member;
  showParticipantPassword: boolean;
  onParticipantPasswordChange: (value: string) => void;
  onSubmitParticipant: (event: FormEvent<HTMLFormElement>) => void;
  onToggleParticipantPassword: () => void;
}

function TripJoinParticipantAuthForm({
  copy,
  isSubmitting,
  isTripAccessVariant,
  participantPassword,
  selectedMember,
  showParticipantPassword,
  onParticipantPasswordChange,
  onSubmitParticipant,
  onToggleParticipantPassword,
}: TripJoinParticipantAuthFormProps) {
  const isClaimed = Boolean(selectedMember.claimPasswordHash || selectedMember.claimedAt);

  return (
    <form className={participantAuthClassName} aria-label={selectedMember.displayName} onSubmit={onSubmitParticipant}>
      <label>
        <span>
          {isClaimed
            ? copy.participantPassword({ name: selectedMember.displayName })
            : copy.setParticipantPassword({ name: selectedMember.displayName })}
        </span>
        <span className={passwordInputRowClassName}>
          <input
            value={participantPassword}
            onChange={(event) => onParticipantPasswordChange(event.target.value)}
            type={showParticipantPassword ? "text" : "password"}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={passwordVisibilityButtonClassName}
            aria-label={showParticipantPassword ? copy.hideParticipantPassword : copy.showParticipantPassword}
            onClick={onToggleParticipantPassword}
          >
            <Icon name={showParticipantPassword ? "eyeOff" : "eye"} />
          </button>
        </span>
      </label>
      {!isClaimed ? (
        <p className={participantAuthHelpClassName}>
          {copy.participantHelp}
        </p>
      ) : null}
      <Button type="submit" className={cn(joinSubmitClassName, isTripAccessVariant ? tripAccessSubmitClassName : "")} disabled={isSubmitting}>
        <Icon name="check" />
        {isClaimed ? copy.confirm : copy.start}
      </Button>
    </form>
  );
}
