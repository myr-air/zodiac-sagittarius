import { cn } from "@/src/lib/cn";
import { PersonAvatar } from "@/src/shared/components/person-avatar";
import {
  memberIdentityClassName,
  memberStatePillClassName,
  memberStatePillToneClassNames,
  memberStatusStackClassName,
  personAvatarClassName,
  presencePillClassName,
  presencePillToneClassNames,
} from "./people-panel.styles";
import { peoplePanelCopy, peoplePanelRoleLabel, presenceLabel } from "./people-panel.copy";
import type { PeoplePanelRowProps } from "./people-panel.types";

type PeoplePanelCopy = ReturnType<typeof peoplePanelCopy>;

interface PeoplePanelRowIdentityProps {
  copy: PeoplePanelCopy;
  currentMemberId: string;
  joined: boolean;
  locale: string;
  member: PeoplePanelRowProps["member"];
}

interface PeoplePanelPresencePillProps {
  member: PeoplePanelRowProps["member"];
}

export function PeoplePanelRowIdentity({
  copy,
  currentMemberId,
  joined,
  locale,
  member,
}: PeoplePanelRowIdentityProps) {
  return (
    <>
      <PersonAvatar
        className={personAvatarClassName}
        color={member.color}
        name={member.displayName}
      />
      <div className={memberIdentityClassName}>
        <strong>{member.displayName}{member.id === currentMemberId ? (locale === "th" ? " (คุณ)" : " (You)") : ""}</strong>
        <span>{peoplePanelRoleLabel(member.role, locale)}</span>
        <div className={memberStatusStackClassName} aria-label={`Status for ${member.displayName}`}>
          <span className={cn(memberStatePillClassName, memberStatePillToneClassNames[member.accessStatus === "disabled" ? "disabled" : "active"])}>
            {member.accessStatus === "disabled" ? copy.disabled : copy.active}
          </span>
          <span className={cn(memberStatePillClassName, memberStatePillToneClassNames[joined ? "claimed" : "pending"])}>
            {joined ? copy.claimed : copy.pending}
          </span>
        </div>
      </div>
    </>
  );
}

export function PeoplePanelPresencePill({ member }: PeoplePanelPresencePillProps) {
  return (
    <span className={cn(presencePillClassName, presencePillToneClassNames[member.presence])}>
      {presenceLabel(member.presence)}
    </span>
  );
}
