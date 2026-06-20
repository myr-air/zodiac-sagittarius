import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { BookingsDocsPage } from "./BookingsDocsPage";
import {
  onStoryCreateBookingDoc,
  onStoryUpdateBookingDoc,
} from "./BookingsDocsPage.stories.support";

type BookingsDocsPagePlay = NonNullable<StoryObj<typeof BookingsDocsPage>["play"]>;

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
