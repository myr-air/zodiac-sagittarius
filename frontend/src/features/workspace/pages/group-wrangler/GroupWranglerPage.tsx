import { useState, useCallback } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { PersonAvatar } from "@/src/shared/components/person-avatar";
import { InviteDialog } from "./InviteDialog";
import { PollCard } from "./PollCard";
import { ActivityRsvpSection } from "./ActivityRsvpSection";
import { ExpenseSettlementSummary } from "./ExpenseSettlementSummary";
import * as styles from "./GroupWranglerPage.styles";
import type { GroupWranglerPageProps } from "./GroupWranglerPage.types";

export function GroupWranglerPage({
  members,
  currentMember,
  activities,
  polls,
  rsvps,
  settlementSuggestions,
  inviteUrl,
  canManagePeople,
  onVote,
  onToggleRsvp,
  onCopyInviteLink,
  onCloseInviteDialog,
}: GroupWranglerPageProps) {
  const { t } = useI18n();
  const gw = t.groupWrangler;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    if (onCopyInviteLink) {
      onCopyInviteLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [inviteUrl, onCopyInviteLink]);

  return (
    <div className={styles.pageClassName}>
      {/* Members Section */}
      <section aria-label={gw.title}>
        <h2 className={styles.sectionTitleClassName}>{gw.title}</h2>
        <div className={styles.memberRowClassName}>
          {members.map((member) => (
            <PersonAvatar
              key={member.id}
              color={member.color}
              name={member.displayName ?? member.id}
              title={member.displayName}
            />
          ))}
          {canManagePeople && (
            <Button
              className={styles.inviteButtonClassName}
              variant="primary"
              onClick={() => setInviteOpen(true)}
            >
              <Icon name="users" />
              {gw.inviteButton}
            </Button>
          )}
        </div>
        {members.length === 0 && (
          <p className="text-(--color-text-muted) text-sm">{gw.emptyMembers}</p>
        )}
      </section>

      {/* Polls Section */}
      <section aria-label={gw.pollsSectionTitle}>
        <h2 className={styles.sectionTitleClassName}>{gw.pollsSectionTitle}</h2>
        {polls.length === 0 ? (
          <p className="text-(--color-text-muted) text-sm">{gw.emptyPolls}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {polls.map((poll) => {
              const activity = activities.find((a) => a.id === poll.activityId);
              return (
                <PollCard
                  key={poll.id}
                  activityName={activity?.activity ?? poll.activityId}
                  poll={poll}
                  currentMemberId={currentMember.id}
                  disabled={!poll.isOpen || !canManagePeople}
                  onVote={
                    onVote
                      ? (optionId) => onVote(poll.activityId, optionId)
                      : undefined
                  }
                  voteCountLabel={(count) => gw.voteCount.replace("{count}", String(count))}
                  tieLabel={gw.tieLabel}
                  voteButton={gw.voteButton}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* RSVP Section */}
      <section aria-label={gw.rsvpSectionTitle}>
        <h2 className={styles.sectionTitleClassName}>{gw.rsvpSectionTitle}</h2>
        <div className="flex flex-col gap-3">
          {activities
            .filter((a) => rsvps.some((r) => r.activityId === a.id))
            .map((activity) => {
              const activityRsvps = rsvps.filter((r) => r.activityId === activity.id);
              return (
                <ActivityRsvpSection
                  key={activity.id}
                  activityName={activity.activity}
                  rsvps={activityRsvps}
                  members={members}
                  currentMemberId={currentMember.id}
                  headcountLabel={(going, total) =>
                    gw.headcountLabel
                      .replace("{going}", String(going))
                      .replace("{total}", String(total))
                  }
                  goingLabel={gw.goingLabel}
                  notGoingLabel={gw.notGoingLabel}
                  onToggleRsvp={
                    onToggleRsvp
                      ? (status) => onToggleRsvp(activity.id, status)
                      : undefined
                  }
                />
              );
            })}
        </div>
      </section>

      {/* Expense Settlement Section */}
      <section aria-label={gw.expenseSummaryTitle}>
        <h2 className={styles.sectionTitleClassName}>{gw.expenseSummaryTitle}</h2>
        <ExpenseSettlementSummary
          suggestions={settlementSuggestions}
          members={members}
          settlementLabel={gw.settlementLabel}
        />
      </section>

      {/* Invite Dialog */}
      {inviteOpen && (
        <InviteDialog
          open={inviteOpen}
          inviteUrl={inviteUrl}
          onClose={() => {
            setInviteOpen(false);
            onCloseInviteDialog?.();
          }}
          onCopyLink={handleCopyLink}
          copied={copied}
          closeAriaLabel={t.common.actions.close}
          copyLinkLabel={gw.copyLinkLabel}
          copyLinkSuccess={gw.copyLinkSuccess}
          qrLabel={gw.qrLabel}
          inviteDialogTitle={gw.inviteDialogTitle}
        />
      )}
    </div>
  );
}
