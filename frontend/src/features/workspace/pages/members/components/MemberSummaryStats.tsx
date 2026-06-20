import { WorkspaceSummaryStat } from "@/src/features/workspace/components/summary-stat";
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
      <WorkspaceSummaryStat
        className={memberStyles.memberStatClassName}
        icon="users"
        label={labels.total}
        value={String(stats.total)}
      />
      <WorkspaceSummaryStat
        className={memberStyles.memberStatClassName}
        icon="check"
        label={labels.active}
        value={String(stats.active)}
      />
      <WorkspaceSummaryStat
        className={memberStyles.memberStatClassName}
        icon="warning"
        label={labels.pending}
        value={String(stats.pending)}
      />
      <WorkspaceSummaryStat
        className={memberStyles.memberStatClassName}
        icon="check"
        label={labels.joined}
        value={String(stats.joined)}
      />
      <WorkspaceSummaryStat
        className={memberStyles.memberStatClassName}
        icon="alertCircle"
        label={labels.disabled}
        value={String(stats.disabled)}
      />
    </section>
  );
}
