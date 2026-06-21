import type { Locale } from "@/src/i18n/types";
import type {
  ExpenseSummary,
  ItineraryItem,
  Suggestion,
  Trip,
} from "@/src/trip/types";
import type { ItineraryView } from "@/src/trip/itinerary";
import { formatMoney } from "@/src/trip/expenses";
import {
  buildDestinationVisual,
  buildHighlightItems,
  getCountdownBadge,
  overviewRoleLens,
} from "@/src/features/itinerary/domain";

interface OverviewPageModelInput {
  completedFocusHeading: string;
  currentMemberId: string;
  expenseSummary: ExpenseSummary;
  focusTodayLabel: string;
  incomingFocusHeading: string;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  locale: Locale;
  suggestions: Suggestion[];
  trip: Trip;
}

export function buildOverviewPageModel({
  completedFocusHeading,
  currentMemberId,
  expenseSummary,
  focusTodayLabel,
  incomingFocusHeading,
  items,
  itineraryView,
  locale,
  suggestions,
  trip,
}: OverviewPageModelInput) {
  const countdown = getCountdownBadge(trip.startDate, trip.endDate, locale);
  const isCompleted = countdown.type === "completed";
  const focusTodayHeading = isCompleted
    ? completedFocusHeading
    : countdown.type === "incoming"
      ? incomingFocusHeading
      : focusTodayLabel;
  const sortedItems =
    itineraryView?.sortedItems ??
    items
      .slice()
      .sort(
        (a, b) =>
          a.day.localeCompare(b.day) ||
          a.sortOrder - b.sortOrder ||
          a.startTime.localeCompare(b.startTime),
      );
  const nextStop = sortedItems[0];
  const warningCount =
    itineraryView?.warningCount ??
    items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const pendingSuggestions = suggestions.filter(
    (suggestion) => suggestion.status === "pending",
  ).length;
  const assignableMembers = trip.members.filter(
    (member) => member.id !== "member-viewer" && member.accessStatus !== "disabled",
  );
  const currentMember = trip.members.find((member) => member.id === currentMemberId);
  const roleLens = overviewRoleLens(currentMember);

  return {
    activeMembers: assignableMembers.length,
    assignableMembers,
    countdown,
    currentMember,
    focusTodayHeading,
    foodStops: sortedItems.filter((item) => item.activityType === "food").slice(0, 3),
    groupSpendLabel: formatMoney(
      expenseSummary.groupSpend,
      expenseSummary.settlementCurrency ?? "HKD",
    ),
    heroVisual: buildDestinationVisual(trip.destinationLabel),
    highlightItems: buildHighlightItems(sortedItems),
    isCompleted,
    isManagerLens: roleLens === "manager",
    isTravelerLens: roleLens === "traveler",
    isViewerLens: roleLens === "viewer",
    nextDayItems: nextStop
      ? sortedItems.filter((item) => item.day === nextStop.day).slice(0, 4)
      : [],
    nextStop,
    pendingSuggestions,
    roleLens,
    settlementCount: expenseSummary.settlementSuggestions.length,
    sortedItems,
    tripHighlights: sortedItems
      .filter((item) => ["attraction", "experience", "shopping"].includes(item.activityType))
      .slice(0, 4),
    viewerHighlights: sortedItems
      .filter((item) => item.activityType !== "travel")
      .slice(0, 5),
    warningCount,
  };
}
