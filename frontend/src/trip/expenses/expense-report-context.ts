import type { ExpenseComment, ItineraryItem, Member } from "../types";

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
  const memberNames = new Map(
    members.map((member) => [member.id, member.displayName]),
  );

  return {
    memberName: (memberId) => memberNames.get(memberId) ?? memberId,
  };
}

export function buildItineraryNameContext(
  itineraryItems: readonly Pick<ItineraryItem, "activity" | "id">[],
): Pick<ExpenseReportContext, "itineraryName"> {
  const itineraryNames = new Map(
    itineraryItems.map((item) => [item.id, item.activity]),
  );

  return {
    itineraryName: (itemId) => itineraryNames.get(itemId) ?? null,
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
