import { fn } from "storybook/test";
import { expectStoryElementClasses } from "@/src/shared/storybook/story-assertions";
import { noop } from "@/src/testing/storybook-actions";
import {
  denseStoryBookingDocs,
  ownerStoryMember,
  storyTasks,
  storyTrip,
  travelerStoryMember,
  viewerStoryMember,
} from "@/src/trip/testing/fixtures/trip-story-fixtures";
import type {
  BookingsDocsPageProps,
  CreateBookingDocHandler,
} from "../BookingsDocsPage";

type BookingsDocsPageStoryArgs = BookingsDocsPageProps;

export const onStoryCreateBookingDoc = fn();
export const onStoryUpdateBookingDoc = fn();

export const bookingsDocsOwnerStoryArgs = {
  trip: storyTrip,
  tasks: storyTasks,
  currentMember: ownerStoryMember,
  bookingDocs: storyTrip.bookingDocs ?? [],
  canEditBookings: true,
  onCreateBookingDoc: noop as CreateBookingDocHandler,
  onUpdateBookingDoc: noop,
  onDeleteBookingDoc: noop,
} satisfies BookingsDocsPageStoryArgs;

export const bookingsDocsViewerStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  currentMember: viewerStoryMember,
  canEditBookings: false,
} satisfies BookingsDocsPageStoryArgs;

export const bookingsDocsTravelerStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  currentMember: travelerStoryMember,
  canEditBookings: true,
} satisfies BookingsDocsPageStoryArgs;

export const denseBookingsDocsStoryArgs = {
  ...bookingsDocsOwnerStoryArgs,
  bookingDocs: denseStoryBookingDocs,
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
  await expectStoryElementClasses(canvasElement, ".bookings-docs-header", "bookings-docs-header", "bg-(--color-surface)", "max-[1199px]:rounded-none");
  await expectStoryElementClasses(canvasElement, ".booking-docs-header-actions", "booking-docs-header-actions", "justify-end");
  await expectStoryElementClasses(canvasElement, ".bookings-content", "bookings-content", "max-[767px]:grid-cols-1", "max-[767px]:gap-0");
  await expectStoryElementClasses(canvasElement, ".booking-folder-rail", "booking-folder-rail", "max-[767px]:grid-cols-7", "max-[767px]:rounded-none", "max-[767px]:shadow-none");
  await expectStoryElementClasses(canvasElement, ".bookings-file-panel", "bookings-file-panel", "max-[767px]:grid-rows-[auto_auto_minmax(0,1fr)]", "max-[767px]:rounded-none", "max-[767px]:shadow-none");
  await expectStoryElementClasses(canvasElement, ".bookings-mobile-add-button", "bookings-mobile-add-button", "!hidden");
  await expectStoryElementClasses(canvasElement, ".booking-inspector", "booking-inspector", "max-[767px]:!fixed", "max-[767px]:bottom-0", "max-[767px]:transition-[transform,opacity]");
}
