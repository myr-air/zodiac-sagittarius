import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookingExternalLinkAction } from "../components/BookingExternalLinkAction";

const link = {
  id: "link-airline",
  label: "Airline booking",
  url: "https://example.com/airline/booking/QR349-HK",
};

const meta = {
  title: "Pages/Bookings & Docs/BookingExternalLinkAction",
  component: BookingExternalLinkAction,
  parameters: { layout: "centered" },
  args: {
    link,
    openLabel: "Open Airline booking",
    variant: "inline",
  },
} satisfies Meta<typeof BookingExternalLinkAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const IconOnly: Story = {
  args: {
    variant: "icon",
  },
};
