import { vi } from "vitest";
import { ContextRail } from "@/src/features/itinerary/components";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { selectedContextRailItem } from "../fixtures/context-rail-fixtures";

export { selectedContextRailItem };

export function renderContextRail(
  overrides: Partial<Parameters<typeof ContextRail>[0]> = {},
) {
  const props: Parameters<typeof ContextRail>[0] = {
    trip: tripFixture.trip,
    selectedItem: selectedContextRailItem,
    suggestions: tripFixture.suggestions,
    stopNotes: tripFixture.stopNotes,
    tasks: tripFixture.tasks,
    bookingDocs: tripFixture.trip.bookingDocs ?? [],
    currentMember: tripFixture.currentMembers.owner,
    expenseSummary: tripFixture.expenseSummaries.owner,
    canEdit: true,
    canCreateNote: true,
    canCreateSuggestion: true,
    canReviewSuggestions: true,
    canEditExpenses: true,
    open: true,
    onCreateNote: vi.fn(),
    onCreateExpense: vi.fn(),
    onUpdateExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
    onDeleteNote: vi.fn(),
    onEditSelected: vi.fn(),
    onUpdateNote: vi.fn(),
    onReviewSuggestion: vi.fn(),
    onSuggestSelected: vi.fn(),
    onToggleTaskStatus: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<ContextRail {...props} />, { locale: "th" });
  return props;
}
