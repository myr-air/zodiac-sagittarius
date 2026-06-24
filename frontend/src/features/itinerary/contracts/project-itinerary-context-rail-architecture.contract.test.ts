import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary context rail architecture", () => {
  it("keeps booking display labels, item actions, and expense forms split by responsibility", () => {
    const bookingDocItem = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailBookingDocItem.tsx",
    );
    const bookingDocItemModel = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/context-rail-booking-doc-item-model.ts",
    );
    const bookingSection = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailBookingSection.tsx",
    );
    const contextRailItemActionButtons = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailItemActionButtons.tsx",
    );
    const contextRailItemActionButtonsStory = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/storybook/ContextRailItemActionButtons.stories.tsx",
    );
    const noteItem = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailNoteItem.tsx",
    );
    const expenseItem = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailExpenseItem.tsx",
    );
    const expenseSection = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailExpensesSection.tsx",
    );
    const expenseForm = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailExpenseForm.tsx",
    );
    const suggestionsSection = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/ContextRailSuggestionsSection.tsx",
    );
    const contextRailUtils = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/context-rail.utils.ts",
    );
    const bookingDisplay = readItineraryArchitectureSource(
      "src/features/itinerary/domain/itinerary-booking-display.ts",
    );
    const bookingDocDisplay = readItineraryArchitectureSource(
      "src/trip/booking-docs/booking-doc-display.ts",
    );
    const contextRailDisplay = readItineraryArchitectureSource(
      "src/features/itinerary/domain/itinerary-context-rail-display.ts",
    );
    const contextRailSelectOptions = readItineraryArchitectureSource(
      "src/features/itinerary/components/context-rail/context-rail-select-options.ts",
    );

    expect(bookingDocItem).toContain("./context-rail-booking-doc-item-model");
    expect(bookingDocItem).not.toContain("function bookingDocQuickFieldCopy");
    expect(bookingDocItem).not.toContain("function getDraftValue");
    expect(bookingDocItemModel).toContain("@/src/trip/booking-docs");
    expect(bookingDocItemModel).toContain("export function bookingDocQuickFieldCopy");
    expect(bookingDocItemModel).toContain("bookingDocQuickFieldPatchFromDraft");
    [noteItem, expenseItem].forEach((source) => {
      expect(source).toContain("./ContextRailItemActionButtons");
      expect(source).not.toContain("noteActionButtonClassName");
      expect(source).not.toContain("noteActionsClassName");
    });
    expect(contextRailItemActionButtons).toContain(
      "export function ContextRailItemActionButtons",
    );
    expect(contextRailItemActionButtons).toContain("noteActionButtonClassName");
    expect(contextRailItemActionButtons).toContain("noteActionsClassName");
    expect(contextRailItemActionButtonsStory).toContain(
      "ContextRailItemActionButtons",
    );
    expect(expenseSection).toContain("./ContextRailExpenseForm");
    expect(expenseSection).not.toContain("contextRailExpenseCategorySelectOptions");
    expect(expenseSection).not.toContain("expenseFormClassName");
    expect(expenseForm).toContain("export function ContextRailExpenseForm");
    expect(expenseForm).toContain("contextRailExpenseCategorySelectOptions");
    expect(expenseForm).toContain("expenseFormClassName");
    expect(contextRailItemActionButtonsStory).toContain("Disabled");
    [bookingSection, noteItem, suggestionsSection].forEach(
      (source) =>
        expect(source).toContain(
          "@/src/features/itinerary/domain/itinerary-context-rail-display",
        ),
    );
    expect(contextRailUtils).not.toContain("function formatBookingDocTypeLabel");
    expect(contextRailUtils).not.toContain("function suggestionLabel");
    expect(contextRailUtils).not.toContain("function memberDisplayName");
    expect(contextRailUtils).not.toContain("bookingDocTypeOptions");
    expect(contextRailUtils).not.toContain("taskKindLabel");
    expect(bookingDisplay).not.toContain("export function formatBookingDocTypeLabel");
    expect(bookingDocDisplay).toContain("export function formatBookingDocTypeLabel");
    expect(contextRailSelectOptions).toContain("@/src/trip/booking-docs");
    expect(contextRailDisplay).toContain("export const bookingDocTypeOptions");
    expect(contextRailDisplay).toContain("export function suggestionLabel");
    expect(contextRailDisplay).toContain("export function memberDisplayName");
    expect(contextRailDisplay).toContain("export { taskKindLabel }");
  });
});
