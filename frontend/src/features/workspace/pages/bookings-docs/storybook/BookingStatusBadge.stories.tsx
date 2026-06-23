import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { bookingCopy } from "../content/BookingsDocsPage.copy";
import { BookingStatusBadge } from "../components/BookingStatusBadge";

const meta = {
  title: "Pages/Bookings & Docs/BookingStatusBadge",
  component: BookingStatusBadge,
  parameters: { layout: "centered" },
  args: {
    copy: bookingCopy.en,
    status: "confirmed",
  },
} satisfies Meta<typeof BookingStatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {};

export const NeedsAction: Story = {
  args: { status: "needs_action" },
};

export const Cancelled: Story = {
  args: { status: "cancelled" },
};

export const Thai: Story = {
  args: {
    copy: bookingCopy.th,
    status: "paid",
  },
};
