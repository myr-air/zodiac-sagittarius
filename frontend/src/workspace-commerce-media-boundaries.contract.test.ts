import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace commerce and media source boundaries", () => {
  it("keeps booking docs, photos, and expenses split by responsibility", () => {
    const {
      bookingDisplay,
      bookingFolders,
      bookingList,
      bookingDialog,
      bookingFilePanel,
      bookingDialogLinks,
      bookingDialogState,
      checkboxGroup,
      workspaceEmptyState,
      photoAlbumBrowser,
      photoAlbumDialog,
      photoAlbumDialogRelatedItems,
      photoAlbumDialogState,
      expenseSummary,
      expenseSettlements,
      expensePageOptions,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(bookingDisplay).toContain("export function formatDateTime");
    expect(bookingDisplay).toContain("export function bookingTypeIcon");
    expect(bookingDisplay).not.toContain("function toDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function fromDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function toggleId");
    expect(bookingDisplay).not.toContain("bookingFolders");
    expect(bookingDisplay).not.toContain("bookingDocMatchesQuery");
    expect(bookingDisplay).not.toContain("compareBookingStartWithUndated");
    expect(bookingFolders).toContain("export const bookingFolders");
    expect(bookingFolders).toContain("export function countBookingFolders");
    expect(bookingList).toContain("@/src/trip/booking-docs");
    expect(bookingList).toContain("bookingDocMatchesQuery");
    expect(bookingList).toContain("compareBookingStartWithUndated");
    expect(bookingList).not.toContain("export function bookingDocMatchesQuery");
    expect(bookingList).not.toContain("export function compareBookingStartWithUndated");
    expect(bookingDialog).toContain("./useBookingDialogState");
    expect(bookingDialog).not.toContain("useState");
    expect(bookingDialog).not.toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialog).not.toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(bookingDialog).not.toContain("DateTimePickerField");
    expect(bookingDialog).not.toContain("CheckboxGroup");
    expect(bookingDialog).toContain("BookingDialogFields");
    expect(bookingDialog).toContain("BookingDialogLinks");
    expect(bookingDialogLinks).toContain("@/src/shared/components/checkbox-group");
    expect(checkboxGroup).toContain("export function CheckboxGroup");
    expect(workspaceEmptyState).toContain("export function WorkspaceEmptyState");
    expect(bookingFilePanel).toContain("@/src/shared/components/workspace-empty-state");
    expect(bookingFilePanel).not.toContain("grid max-w-[360px] gap-1");
    expect(bookingDialogState).toContain("export function useBookingDialogState");
    expect(bookingDialogState).toContain("export type BookingDialogState");
    expect(bookingDialogState).toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialogState).toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(bookingDialogState).toContain("function submit");

    expect(photoAlbumDialog).toContain("./usePhotoAlbumDialogState");
    expect(photoAlbumDialog).toContain("PhotoAlbumDialogFields");
    expect(photoAlbumDialog).toContain("PhotoAlbumDialogRelatedItems");
    expect(photoAlbumDialog).not.toContain("useState");
    expect(photoAlbumDialog).not.toContain("photoProviderOptions");
    expect(photoAlbumDialog).not.toContain("relatedItineraryItemIds.includes");
    expect(photoAlbumBrowser).toContain("@/src/shared/components/workspace-empty-state");
    expect(photoAlbumBrowser).not.toContain("function PhotoAlbumEmptyState");
    expect(photoAlbumBrowser).not.toContain("grid max-w-[360px] gap-1");
    expect(photoAlbumDialogRelatedItems).toContain("@/src/shared/components/checkbox-group");
    expect(photoAlbumDialogRelatedItems).not.toContain("<input type=\"checkbox\"");
    expect(photoAlbumDialogState).toContain("export function usePhotoAlbumDialogState");
    expect(photoAlbumDialogState).toContain("export type PhotoAlbumDialogState");
    expect(photoAlbumDialogState).toContain("function toggleRelatedItem");
    expect(photoAlbumDialogState).toContain("async function submit");

    expect(expenseSummary).toContain("./expense-settlements");
    expect(expenseSummary).not.toContain("function buildSettlementSuggestions");
    expect(expenseSummary).not.toContain("function expenseReminderKey");
    expect(expenseSettlements).toContain("export function buildSettlementSuggestions");
    expect(expenseSettlements).toContain("export function attachReminderHistory");
    expect(expenseSettlements).toContain("export function upsertExpenseReminder");
    expect(expenseSettlements).toContain("function expenseReminderKey");
    expect(expensePageOptions).toContain("export const expenseCategories");
    expect(expensePageOptions).toContain("export const expenseSplitModes");
    expect(expensePageOptions).toContain("function categoryTone");
  });
});
