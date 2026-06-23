import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace commerce and media source boundaries", () => {
  it("keeps booking docs, photos, and expenses split by responsibility", () => {
    const {
      bookingDisplay,
      bookingFolders,
      bookingList,
      bookingDialog,
      bookingDialogFields,
      bookingFilePanel,
      bookingFileList,
      bookingDialogLinks,
      bookingDialogState,
      checkboxGroup,
      workspaceEmptyState,
      photoAlbumBrowser,
      photoAlbumDialog,
      photoAlbumDialogActions,
      photoAlbumDialogRelatedItems,
      photoAlbumDialogState,
      photoPageOptions,
      photoPageSelectors,
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
    expect(bookingDialog).toContain("../hooks/useBookingDialogState");
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
    expect(bookingFilePanel).toContain("./BookingFileList");
    expect(bookingFilePanel).not.toContain("@/src/shared/components/workspace-empty-state");
    expect(bookingFileList).toContain("@/src/shared/components/workspace-empty-state");
    expect(bookingFilePanel).not.toContain("grid max-w-[360px] gap-1");
    expect(bookingFileList).not.toContain("grid max-w-[360px] gap-1");
    expect(bookingDialogState).toContain("export function useBookingDialogState");
    expect(bookingDialogState).toContain("export type BookingDialogState");
    expect(bookingDialogState).not.toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialogState).not.toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(bookingDialogState).toContain("@/src/shared/form-state");
    expect(bookingDialogState).toContain("function submit");
    expect(bookingDialogFields).toContain("export function initialBookingDialogFields");
    expect(bookingDialogFields).toContain("export function buildBookingDialogSubmitInput");
    expect(bookingDialogFields).not.toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialogFields).toContain("@/src/shared/date-time-local");

    expect(photoAlbumDialog).toContain("../hooks/usePhotoAlbumDialogState");
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
    expect(photoAlbumDialogState).toContain("@/src/shared/form-state");
    expect(photoAlbumDialogState).toContain("function toggleRelatedItem");
    expect(photoAlbumDialogState).toContain("usePhotoAlbumDialogActions");
    expect(photoAlbumDialogState).not.toContain("async function submit");
    expect(photoAlbumDialogActions).toContain("export function usePhotoAlbumDialogActions");
    expect(photoAlbumDialogActions).toContain("async function submit");
    expect(photoAlbumDialogActions).toContain("buildPhotoAlbumDialogSubmitInput");
    expect(photoPageOptions).toContain("export const photoProviderOptions");
    expect(photoPageOptions).toContain("export function photoProviderLabel");
    expect(photoPageSelectors).toContain("export function countPhotoProviders");
    expect(photoPageSelectors).toContain("export function photoAlbumLinkHost");

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
