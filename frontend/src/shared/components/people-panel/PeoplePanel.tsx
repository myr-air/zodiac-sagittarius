import { useI18n } from "@/src/i18n/I18nProvider";
import {
  peopleHeadingClassName,
  peopleListClassName,
  peopleModuleClassName,
} from "./people-panel.styles";
import { peoplePanelCopy } from "./people-panel.copy";
import { PeoplePanelEmptyState } from "./PeoplePanelEmptyState";
import { PeoplePanelRow } from "./PeoplePanelRow";
import type { PeoplePanelProps } from "./people-panel.types";

export function PeoplePanel({
  members,
  currentMemberId,
  canManagePeople = false,
  emptyMessage = "ยังไม่มีสมาชิก",
  onChangeMemberAccessStatus,
  onChangeCurrentMemberPassword,
  onChangeMemberRole,
  onResetFilters,
  onResetMemberClaim,
  onTransferOwnership,
}: PeoplePanelProps) {
  const { locale } = useI18n();
  const copy = peoplePanelCopy(locale);
  return (
    <section className={peopleModuleClassName} aria-label="People and presence">
      <h3 className={peopleHeadingClassName}>{copy.heading}</h3>
      <div className={peopleListClassName}>
        {members.length === 0 ? (
          <PeoplePanelEmptyState
            emptyMessage={emptyMessage}
            locale={locale}
            onResetFilters={onResetFilters}
          />
        ) : members.map((member) => {
          return (
            <PeoplePanelRow
              canManagePeople={canManagePeople}
              currentMemberId={currentMemberId}
              key={member.id}
              locale={locale}
              member={member}
              onChangeCurrentMemberPassword={onChangeCurrentMemberPassword}
              onChangeMemberAccessStatus={onChangeMemberAccessStatus}
              onChangeMemberRole={onChangeMemberRole}
              onResetMemberClaim={onResetMemberClaim}
              onTransferOwnership={onTransferOwnership}
            />
          );
        })}
      </div>
    </section>
  );
}
