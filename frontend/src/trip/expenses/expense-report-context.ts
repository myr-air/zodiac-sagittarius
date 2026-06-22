import type { ExpenseComment, ItineraryItem, Member } from "../types";
import { buildItineraryActivityResolver } from "../itinerary-items";
import { buildMemberDisplayNameResolver } from "../members/member-lookup";

interface ExpenseReportContextInput {
  itineraryItems: readonly Pick<ItineraryItem, "activity" | "id">[];
  members: readonly Pick<Member, "displayName" | "id">[];
}

export interface ExpenseReportContext {
  itineraryName: (itemId: string) => string | null;
  memberName: (memberId: string) => string;
}

export function buildExpenseReportContext(
  trip: ExpenseReportContextInput,
): ExpenseReportContext {
  return {
    ...buildMemberNameContext(trip.members),
    ...buildItineraryNameContext(trip.itineraryItems),
  };
}

export function buildMemberNameContext(
  members: readonly Pick<Member, "displayName" | "id">[],
): Pick<ExpenseReportContext, "memberName"> {
  return {
    memberName: buildMemberDisplayNameResolver(members),
  };
}

export function buildItineraryNameContext(
  itineraryItems: readonly Pick<ItineraryItem, "activity" | "id">[],
): Pick<ExpenseReportContext, "itineraryName"> {
  return {
    itineraryName: buildItineraryActivityResolver(itineraryItems),
  };
}

export function formatExpenseComments(
  comments: readonly ExpenseComment[],
  context: Pick<ExpenseReportContext, "memberName">,
): string[] {
  return comments
    .filter((comment) => comment.body.trim())
    .map(
      (comment) => `${context.memberName(comment.authorId)}: ${comment.body.trim()}`,
    );
}
