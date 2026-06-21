import { expect, fn } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { seedTrip } from "@/src/trip/seed";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { BookingDoc } from "@/src/trip/types";
import type { BookingDocInput, BookingsDocsPage } from "../BookingsDocsPage";

type BookingsDocsPageStoryArgs = Parameters<typeof BookingsDocsPage>[0];

export const onStoryCreateBookingDoc = fn();
export const onStoryUpdateBookingDoc = fn();

const denseBookingDocs: BookingDoc[] = Array.from({ length: 16 }, (_, index) => {
  const base = (seedTrip.bookingDocs ?? [])[index % (seedTrip.bookingDocs?.length || 1)] ?? {
    id: "booking-doc-fallback",
    tripId: seedTrip.id,
    type: "other",
    title: "Travel document",
    status: "draft",
    visibility: "shared",
    ownerMemberId: tripFixture.currentMembers.owner.id,
    providerName: "Shared supplier",
    confirmationCode: "REF-000",
    startsAt: `${seedTrip.startDate}T09:00:00.000Z`,
    endsAt: `${seedTrip.startDate}T10:00:00.000Z`,
    timezone: "Asia/Hong_Kong",
    priceAmount: 120,
    currency: "USD",
    travelerIds: [tripFixture.currentMembers.traveler.id],
    externalLinks: [],
    relatedItineraryItemIds: [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: "Dense Storybook coverage item for booking and document layout.",
    createdBy: tripFixture.currentMembers.owner.id,
    updatedAt: "2026-05-27T00:00:00.000Z",
    version: 1,
  } satisfies BookingDoc;

  return {
    ...base,
    id: `booking-doc-dense-${index + 1}`,
    tripId: seedTrip.id,
    title: `${base.title} ${index + 1}`,
    status: index % 5 === 0 ? "needs_action" : base.status,
    providerName: base.providerName ?? "Shared supplier",
    confirmationCode: base.confirmationCode ?? `REF-${String(index + 1).padStart(3, "0")}`,
    priceAmount: base.priceAmount ?? (index + 1) * 120,
    updatedAt: `2026-05-${String(10 + (index % 17)).padStart(2, "0")}T00:00:00.000Z`,
    version: base.version + index + 1,
  };
});

export const bookingsDocsOwnerStoryArgs = {
  trip: seedTrip,
  tasks: tripFixture.tasks,
  currentMember: tripFixture.currentMembers.owner,
  bookingDocs: seedTrip.bookingDocs ?? [],
  canEditBookings: true,
  onCreateBookingDoc: noop as (input: BookingDocInput) => void,
  onUpdateBookingDoc: noop,
  onDeleteBookingDoc: noop,
} satisfies BookingsDocsPageStoryArgs;

export const bookingsDocsViewerStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.viewer,
  canEditBookings: false,
} satisfies BookingsDocsPageStoryArgs;

export const bookingsDocsTravelerStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.traveler,
  canEditBookings: true,
} satisfies BookingsDocsPageStoryArgs;

export const denseBookingsDocsStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  bookingDocs: denseBookingDocs,
} satisfies BookingsDocsPageStoryArgs;

export const emptyBookingsDocsStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  bookingDocs: [],
} satisfies BookingsDocsPageStoryArgs;

export const paidCommitmentLifecycleStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  onCreateBookingDoc: onStoryCreateBookingDoc,
  onUpdateBookingDoc: onStoryUpdateBookingDoc,
} satisfies BookingsDocsPageStoryArgs;

export async function expectBookingsResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".page-header")).toHaveClass("page-header", "bg-(--color-surface)", "max-[767px]:hidden");
  await expect(canvasElement.querySelector(".booking-docs-header-actions")).toHaveClass("booking-docs-header-actions", "justify-end");
  await expect(canvasElement.querySelector(".bookings-content")).toHaveClass("bookings-content", "max-[767px]:grid-cols-1", "max-[767px]:gap-0");
  await expect(canvasElement.querySelector(".booking-folder-rail")).toHaveClass("booking-folder-rail", "max-[767px]:grid-cols-7", "max-[767px]:rounded-none", "max-[767px]:shadow-none");
  await expect(canvasElement.querySelector(".bookings-file-panel")).toHaveClass("bookings-file-panel", "max-[767px]:grid-rows-[auto_auto_minmax(0,1fr)]", "max-[767px]:rounded-none", "max-[767px]:shadow-none");
  await expect(canvasElement.querySelector(".bookings-mobile-add-button")).toHaveClass("bookings-mobile-add-button", "max-[767px]:fixed");
  await expect(canvasElement.querySelector(".booking-inspector")).toHaveClass("booking-inspector", "max-[767px]:!fixed", "max-[767px]:bottom-0", "max-[767px]:transition-[transform,opacity]");
}
