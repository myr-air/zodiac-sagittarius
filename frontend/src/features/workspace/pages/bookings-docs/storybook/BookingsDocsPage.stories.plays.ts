import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { BookingsDocsPage } from "../BookingsDocsPage";
import {
  expectBookingsResponsiveContract,
  onStoryCreateBookingDoc,
  onStoryUpdateBookingDoc,
} from "./BookingsDocsPage.stories.support";

type BookingsDocsPagePlay = NonNullable<StoryObj<typeof BookingsDocsPage>["play"]>;

export const ownerPlay: BookingsDocsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Bookings & Docs/i })).toHaveClass("bookings-docs-page");
  await expect(canvas.getByRole("button", { name: /Add booking/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeVisible();
};

export const viewerPlay: BookingsDocsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Bookings & Docs/i })).toBeVisible();
  await expect(canvas.queryByRole("button", { name: /Add booking/i })).toBeNull();
  await expect(canvas.getAllByText(/Locked sensitive record/i).length).toBeGreaterThan(0);
};

export const travelerPlay: BookingsDocsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Bookings & Docs/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Add booking/i })).toBeEnabled();
};

export const ownerThaiPlay: BookingsDocsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /การจองและเอกสาร/i })).toHaveClass("bookings-docs-page");
  await expect(canvas.getByRole("button", { name: /เพิ่มการจอง/i })).toBeVisible();
  await expect(canvas.getByLabelText(/สรุปการจอง/i)).toBeVisible();
  await expect(canvas.getByLabelText(/โฟลเดอร์การจอง/i)).toBeVisible();
  await expect(canvas.getByText(/มิ\.ย\. 2026/i)).toBeVisible();
};

export const densePlay: BookingsDocsPagePlay = async ({ canvas }) => {
  await expect(canvas.getAllByRole("button", { name: /Select/i }).length).toBeGreaterThan(8);
};

export const emptyPlay: BookingsDocsPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText(/No items in this view/i)).toBeVisible();
};

export const addBookingDialogOpenPlay: BookingsDocsPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("button", { name: /Add booking/i }));
  await expect(canvas.getByRole("dialog", { name: /Add booking/i })).toHaveClass("booking-dialog");
  await expect(canvas.getByText("Confirmation code")).toBeVisible();
  await expect(canvas.getByText("Linked itinerary")).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Save booking/i })).toBeVisible();
};

export const mobilePlay: BookingsDocsPagePlay = async ({ canvas, canvasElement }) => {
  await expectBookingsResponsiveContract(canvasElement);
  await expect(canvas.getByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i })).toHaveClass("bookings-docs-page");
  await expect(canvas.getByLabelText(/Booking folders|โฟลเดอร์การจอง/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Add booking|เพิ่มการจอง/i })).toBeVisible();
};

export const responsivePlay: BookingsDocsPagePlay = async ({ canvasElement }) => {
  await expectBookingsResponsiveContract(canvasElement);
};

export const paidCommitmentLifecyclePlay: BookingsDocsPagePlay = async ({ canvas }) => {
  onStoryCreateBookingDoc.mockClear();
  onStoryUpdateBookingDoc.mockClear();

  await userEvent.click(canvas.getByRole("button", { name: /Add booking/i }));
  let dialog = canvas.getByRole("dialog", { name: /Add booking/i });
  await userEvent.type(within(dialog).getByLabelText("Title"), "Paid Airport Express pass");
  await userEvent.selectOptions(within(dialog).getByLabelText("Type"), "public_transport");
  await userEvent.selectOptions(within(dialog).getByLabelText("Status"), "paid");
  await userEvent.type(within(dialog).getByLabelText("Provider"), "MTR");
  await userEvent.type(within(dialog).getByLabelText("Confirmation code"), "AEL-PAID-01");
  await userEvent.clear(within(dialog).getByLabelText("Price"));
  await userEvent.type(within(dialog).getByLabelText("Price"), "880");
  await userEvent.clear(within(dialog).getByLabelText("Currency"));
  await userEvent.type(within(dialog).getByLabelText("Currency"), "HKD");
  await userEvent.click(within(dialog).getByRole("checkbox", { name: "Peak Tram tickets" }));
  await userEvent.click(within(dialog).getByRole("button", { name: /Save booking/i }));

  await expect(onStoryCreateBookingDoc).toHaveBeenCalledWith(expect.objectContaining({
    title: "Paid Airport Express pass",
    type: "public_transport",
    status: "paid",
    providerName: "MTR",
    confirmationCode: "AEL-PAID-01",
    priceAmount: 880,
    currency: "HKD",
    relatedExpenseIds: ["expense-peak-tram"],
  }));

  const flightCard = canvas
    .getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })
    .closest(".booking-ticket-card") as HTMLElement;
  await userEvent.click(within(flightCard).getByRole("button", { name: "Edit booking" }));
  dialog = canvas.getByRole("dialog", { name: /Edit booking/i });
  await userEvent.selectOptions(within(dialog).getByLabelText("Status"), "paid");
  await userEvent.click(within(dialog).getByRole("checkbox", { name: "Peak Tram tickets" }));
  await userEvent.click(within(dialog).getByRole("button", { name: /Save booking/i }));

  await expect(onStoryUpdateBookingDoc).toHaveBeenCalledWith("booking-flight-bkk-hkg", expect.objectContaining({
    title: "Bangkok to Hong Kong flight",
    status: "paid",
    priceAmount: 2180,
    currency: "HKD",
    relatedExpenseIds: ["expense-peak-tram"],
  }));
};
