import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { BookingDocType } from "@/src/trip/types";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import { bookingCopy } from "../content/BookingsDocsPage.copy";
import { BookingTypeLabel, BookingTypeMark } from "../components/BookingTypeDisplay";

function BookingTypeDisplayStory({
  copy,
  type,
}: {
  copy: BookingCopy;
  type: BookingDocType;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <BookingTypeMark type={type} />
      <BookingTypeLabel className="text-sm font-extrabold text-(--color-text)" copy={copy} type={type} />
    </div>
  );
}

const meta = {
  title: "Pages/Bookings & Docs/BookingTypeDisplay",
  component: BookingTypeDisplayStory,
  parameters: { layout: "centered" },
  args: {
    copy: bookingCopy.en,
    type: "flight",
  },
} satisfies Meta<typeof BookingTypeDisplayStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Flight: Story = {};

export const Hotel: Story = {
  args: { type: "hotel" },
};

export const PassportThai: Story = {
  args: {
    copy: bookingCopy.th,
    type: "passport",
  },
};
