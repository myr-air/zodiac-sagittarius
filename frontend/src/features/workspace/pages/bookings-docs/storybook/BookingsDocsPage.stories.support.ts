import { expect, fn } from "storybook/test";
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
  await expect(canvasElement.querySelector(".page-header")).toHaveClass("page-header", "bg-(--color-surface)", "max-[767px]:hidden");
  await expect(canvasElement.querySelector(".booking-docs-header-actions")).toHaveClass("booking-docs-header-actions", "justify-end");
  await expect(canvasElement.querySelector(".bookings-content")).toHaveClass("bookings-content", "max-[767px]:grid-cols-1", "max-[767px]:gap-0");
  await expect(canvasElement.querySelector(".booking-folder-rail")).toHaveClass("booking-folder-rail", "max-[767px]:grid-cols-7", "max-[767px]:rounded-none", "max-[767px]:shadow-none");
  await expect(canvasElement.querySelector(".bookings-file-panel")).toHaveClass("bookings-file-panel", "max-[767px]:grid-rows-[auto_auto_minmax(0,1fr)]", "max-[767px]:rounded-none", "max-[767px]:shadow-none");
  await expect(canvasElement.querySelector(".bookings-mobile-add-button")).toHaveClass("bookings-mobile-add-button", "max-[767px]:fixed");
  await expect(canvasElement.querySelector(".booking-inspector")).toHaveClass("booking-inspector", "max-[767px]:!fixed", "max-[767px]:bottom-0", "max-[767px]:transition-[transform,opacity]");
}
