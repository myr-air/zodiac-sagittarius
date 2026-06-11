import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { BookingDocInput } from "./BookingsDocsPage";
import { BookingsDocsPage } from "./BookingsDocsPage";

const noop = () => {};

const meta = {
  title: "Pages/Bookings & Docs",
  component: BookingsDocsPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof BookingsDocsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: seedTrip,
    tasks: tripFixture.tasks,
    currentMember: tripFixture.currentMembers.owner,
    bookingDocs: seedTrip.bookingDocs ?? [],
    canEditBookings: true,
    onCreateBookingDoc: noop as (input: BookingDocInput) => void,
    onUpdateBookingDoc: noop,
    onDeleteBookingDoc: noop,
  },
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

export const Empty: Story = {
  args: {
    ...Owner.args,
    bookingDocs: [],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/No items in this view/i)).toBeVisible();
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
