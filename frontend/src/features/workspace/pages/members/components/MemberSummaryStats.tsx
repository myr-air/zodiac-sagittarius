import { Icon } from "@/src/ui/icons";
import * as memberStyles from "../TripMembersPage.styles";

interface MemberSummaryStatsProps {
  labels: {
    active: string;
    disabled: string;
    joined: string;
    pending: string;
    total: string;
  };
  stats: {
    active: number;
    disabled: number;
    joined: number;
    pending: number;
    total: number;
  };
  summaryLabel: string;
}

export function MemberSummaryStats({ labels, stats, summaryLabel }: MemberSummaryStatsProps) {
  return (
    <section className={memberStyles.memberStatGridClassName} aria-label={summaryLabel}>
      <div className={memberStyles.memberStatClassName}>
        <Icon name="users" />
        <span>{labels.total}</span>
        <strong>{stats.total}</strong>
      </div>
      <div className={memberStyles.memberStatClassName}>
        <Icon name="check" />
        <span>{labels.active}</span>
        <strong>{stats.active}</strong>
      </div>
      <div className={memberStyles.memberStatClassName}>
        <Icon name="warning" />
        <span>{labels.pending}</span>
        <strong>{stats.pending}</strong>
      </div>
      <div className={memberStyles.memberStatClassName}>
        <Icon name="check" />
        <span>{labels.joined}</span>
        <strong>{stats.joined}</strong>
      </div>
      <div className={memberStyles.memberStatClassName}>
        <Icon name="alertCircle" />
        <span>{labels.disabled}</span>
        <strong>{stats.disabled}</strong>
      </div>
    </section>
  );
}
