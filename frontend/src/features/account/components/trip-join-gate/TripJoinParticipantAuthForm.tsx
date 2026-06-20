import type { FormEvent } from "react";
import { cn } from "@/src/lib/cn";
import type { Member } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import {
  joinSubmitClassName,
  participantAuthClassName,
  participantAuthHelpClassName,
  passwordInputRowClassName,
  passwordVisibilityButtonClassName,
  tripAccessSubmitClassName,
} from "./trip-join-gate.styles";

export interface TripJoinParticipantAuthFormCopy {
  confirm: string;
  hideParticipantPassword: string;
  participantHelp: string;
  participantPassword: (params: { name: string }) => string;
  setParticipantPassword: (params: { name: string }) => string;
  showParticipantPassword: string;
  start: string;
}

interface TripJoinParticipantAuthFormProps {
  copy: TripJoinParticipantAuthFormCopy;
  isSubmitting: boolean;
  isTripAccessVariant: boolean;
  participantPassword: string;
  selectedMember: Member;
  showParticipantPassword: boolean;
  onParticipantPasswordChange: (value: string) => void;
  onSubmitParticipant: (event: FormEvent<HTMLFormElement>) => void;
  onToggleParticipantPassword: () => void;
}

export function TripJoinParticipantAuthForm({
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
