import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { BookingDoc } from "@/src/trip/types";
import type { BookingDocInput } from "./BookingsDocsPage";
import { BookingsDocsPage } from "./BookingsDocsPage";

const noop = () => {};
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

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i })).toHaveClass("bookings-docs-page");
    await expect(canvas.getByLabelText(/Booking folders|โฟลเดอร์การจอง/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Add booking|เพิ่มการจอง/i })).toBeVisible();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
};
