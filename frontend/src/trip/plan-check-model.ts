/**
 * Plan-check inspector — findings-by-stop scoping model (M82LQRZD T2 #1)
 * plus rail summary aggregates (M82LQRZD T2 #2). groupFindingsByStop maps a
 * PlanCheckSummary to per-target-item finding groups using only
 * status=pending suggestions; betweenItems/multi-target findings appear
 * under each targetItemId; accepted/dismissed/snoozed are excluded.
 * stopFindingSummary and planPendingTotal are plan-check-scoped rail
 * aggregates — distinct from member suggestions and M2 sibling overlap
 * cues, which have their own models.
 */
import type { PlanCheckSummary, PlanSuggestionSummary } from "./plan-check-api";

export type FindingsByStop = Record<string, PlanSuggestionSummary[]>;

export function groupFindingsByStop(
  summary: PlanCheckSummary,
): FindingsByStop {
  const groups: FindingsByStop = {};
  for (const suggestion of summary.suggestions) {
    if (suggestion.status !== "pending") continue;
    for (const targetItemId of suggestion.targetItemIds) {
      const existing = groups[targetItemId];
      if (existing) {
        existing.push(suggestion);
      } else {
        groups[targetItemId] = [suggestion];
      }
    }
  }
  return groups;
}

/** Per-stop highest severity + pending finding count, for the rail summary line. */
export type StopFindingSummary = {
  severity: string;
  count: number;
};

/** Severity rank for comparison: error/critical > warning > info. */
const SEVERITY_RANK: Record<string, number> = {
  error: 3,
  critical: 3,
  warning: 2,
  info: 1,
};

/**
 * Highest severity (error/critical > warning > info) and count among the
 * pending findings grouped under `itemId` by groupFindingsByStop. Returns
 * undefined when the stop has no pending findings.
 */
export function stopFindingSummary(
  groups: FindingsByStop,
  itemId: string,
): StopFindingSummary | undefined {
  const findings = groups[itemId];
  if (!findings || findings.length === 0) return undefined;

  let highest = findings[0].severity;
  for (const finding of findings) {
    const currentRank = SEVERITY_RANK[highest] ?? 0;
    const candidateRank = SEVERITY_RANK[finding.severity] ?? 0;
    if (candidateRank > currentRank) {
      highest = finding.severity;
    }
  }

  return { severity: highest, count: findings.length };
}

/**
 * Total number of distinct status=pending suggestions across the whole
 * plan check, for the rail summary line. A betweenItems suggestion
 * targeting multiple stops counts once.
 */
export function planPendingTotal(summary: PlanCheckSummary): number {
  let count = 0;
  for (const suggestion of summary.suggestions) {
    if (suggestion.status === "pending") count++;
  }
  return count;
}
