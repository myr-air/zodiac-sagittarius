import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { BookingsDocsPage } from "./BookingsDocsPage";
import {
  bookingsDocsOwnerStoryArgs,
  denseBookingDocs,
  expectBookingsResponsiveContract,
  onStoryCreateBookingDoc,
  onStoryUpdateBookingDoc,
} from "./BookingsDocsPage.stories.support";

const meta = {
  title: "Pages/Bookings & Docs",
  component: BookingsDocsPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof BookingsDocsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: bookingsDocsOwnerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Bookings & Docs/i })).toHaveClass("bookings-docs-page");
    await expect(canvas.getByRole("button", { name: /Add booking/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeVisible();
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.viewer,
    canEditBookings: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Bookings & Docs/i })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /Add booking/i })).toBeNull();
    await expect(canvas.getAllByText(/Locked sensitive record/i).length).toBeGreaterThan(0);
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.traveler,
    canEditBookings: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Bookings & Docs/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Add booking/i })).toBeEnabled();
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /การจองและเอกสาร/i })).toHaveClass("bookings-docs-page");
    await expect(canvas.getByRole("button", { name: /เพิ่มการจอง/i })).toBeVisible();
    await expect(canvas.getByLabelText(/สรุปการจอง/i)).toBeVisible();
    await expect(canvas.getByLabelText(/โฟลเดอร์การจอง/i)).toBeVisible();
    await expect(canvas.getByText(/มิ\.ย\. 2026/i)).toBeVisible();
  },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    bookingDocs: denseBookingDocs,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("button", { name: /Select/i }).length).toBeGreaterThan(8);
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    bookingDocs: [],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/No items in this view/i)).toBeVisible();
  },
};

export const AddBookingDialogOpen: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Add booking/i }));
    await expect(canvas.getByRole("dialog", { name: /Add booking/i })).toHaveClass("booking-dialog");
    await expect(canvas.getByText("Confirmation code")).toBeVisible();
    await expect(canvas.getByText("Linked itinerary")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save booking/i })).toBeVisible();
  },
};

export const PaidCommitmentLifecycle: Story = {
  args: {
    ...Owner.args,
    onCreateBookingDoc: onStoryCreateBookingDoc,
    onUpdateBookingDoc: onStoryUpdateBookingDoc,
  },
  play: async ({ canvas }) => {
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
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas, canvasElement }) => {
    await expectBookingsResponsiveContract(canvasElement);
    await expect(canvas.getByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i })).toHaveClass("bookings-docs-page");
    await expect(canvas.getByLabelText(/Booking folders|โฟลเดอร์การจอง/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Add booking|เพิ่มการจอง/i })).toBeVisible();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectBookingsResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectBookingsResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectBookingsResponsiveContract(canvasElement);
  },
};
