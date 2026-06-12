import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { ItineraryItem } from "@/src/trip/types";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { StopDialog } from "./StopDialog";

const noop = () => {};
const storyItem = tripFixture.planItems[0];

function categoryItem(overrides: Partial<ItineraryItem>): ItineraryItem {
  return {
    ...storyItem,
    ...overrides,
    details: {
      ...storyItem.details,
      ...overrides.details,
    },
  };
}

const meta = {
  title: "Pages/Stop Dialog",
  component: StopDialog,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof StopDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    mode: "create",
    startDate: tripFixture.trip.startDate,
    endDate: tripFixture.trip.endDate,
    initialDay: tripFixture.trip.startDate,
    manualPathOptions: [
      { id: "main", name: "Main" },
      { id: "path-plan-a", name: "Plan A" },
    ],
    onClose: noop,
    onSubmit: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /Add activity/i })).toHaveClass("stop-dialog");
    await expect(canvas.getByRole("textbox", { name: /^Activity$/i })).toBeVisible();
  },
};

export const Edit: Story = {
  args: {
    ...Create.args,
    mode: "edit",
    initialItem: tripFixture.planItems[0],
    onDelete: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /Edit details/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Delete stop/i })).toBeVisible();
  },
};

export const AmbiguousPlace: Story = {
  args: {
    ...Create.args,
    placeResolution: {
      state: "ambiguous",
      candidates: [
        {
          name: "Central Market Kuala Lumpur",
          address: "Jalan Hang Kasturi, Kuala Lumpur",
          coordinates: { lat: 3.1459, lng: 101.6956 },
          mapLink: "https://maps.example.test/central-market-kl",
          confidence: 0.92,
          source: "storybook",
          evidence: ["Name and district match"],
        },
        {
          name: "Central Market Annexe",
          address: "Pasar Seni, Kuala Lumpur",
          coordinates: { lat: 3.1447, lng: 101.6962 },
          mapLink: "https://maps.example.test/central-market-annexe",
          confidence: 0.74,
          source: "storybook",
          evidence: ["Nearby alternate venue"],
        },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Central Market Kuala Lumpur/i)).toBeVisible();
    await expect(canvas.getByText(/Central Market Annexe/i)).toBeVisible();
  },
};

export const TransportationForm: Story = {
  args: {
    ...Edit.args,
    initialItem: categoryItem({
      activity: "DMK -> HKG",
      activityType: "travel",
      durationMinutes: 175,
      place: "",
      transportation: "Plane",
      details: {
        kind: "transportation",
        origin: "Don Mueang International Airport",
        destination: "Hong Kong International Airport",
        mode: "Plane",
        ticketRef: "FD ticket",
        costNote: "Prepaid group fare",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /Edit details/i })).toBeVisible();
    await expect(canvas.getByLabelText("Type")).toHaveValue("transportation");
    await expect(canvas.getByLabelText("From")).toHaveValue("Don Mueang International Airport");
    await expect(canvas.getByLabelText("To")).toHaveValue("Hong Kong International Airport");
    await expect(canvas.getByLabelText("Ticket / pass")).toHaveValue("FD ticket");
    await expect(canvas.queryByLabelText("Transportation")).not.toBeInTheDocument();
  },
};

export const FoodForm: Story = {
  args: {
    ...Edit.args,
    initialItem: categoryItem({
      activity: "Dim sum lunch",
      activityType: "food",
      itemKind: "meal",
      place: "Central Market",
      details: {
        kind: "food",
        meal: "Lunch",
        reservationName: "Cecilia Puni",
        mustTry: "Char siu bao",
        budgetNote: "MYR 60 per person",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("food");
    await expect(canvas.getByLabelText("Meal")).toHaveValue("Lunch");
    await expect(canvas.getByLabelText("Reservation name")).toHaveValue("Cecilia Puni");
    await expect(canvas.getByLabelText("Must try")).toHaveValue("Char siu bao");
    await expect(canvas.getByLabelText("Transportation")).toBeVisible();
  },
};

export const StayForm: Story = {
  args: {
    ...Edit.args,
    initialItem: categoryItem({
      activity: "Hotel check-in",
      activityType: "stay",
      itemKind: "lodging",
      place: "The Chow Kit",
      details: {
        kind: "stay",
        entryWindow: "15:00 check-in / 11:00 check-out",
        bookingRef: "WK-2409",
        detail: "Leave bags before the food walk",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("stay");
    await expect(canvas.getByLabelText("Check-in / out")).toHaveValue("15:00 check-in / 11:00 check-out");
    await expect(canvas.getByLabelText("Booking ref")).toHaveValue("WK-2409");
    await expect(canvas.getByLabelText("Bag / luggage detail")).toHaveValue("Leave bags before the food walk");
  },
};

export const ShoppingForm: Story = {
  args: {
    ...Edit.args,
    initialItem: categoryItem({
      activity: "Souvenir run",
      activityType: "shopping",
      place: "Central Market",
      details: {
        kind: "shopping",
        targetItems: "Batik scarf, coffee, postcard",
        budgetNote: "MYR 180 shared gift cap",
        taxRefundNote: "Keep receipts above threshold",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("shopping");
    await expect(canvas.getByLabelText("Target items")).toHaveValue("Batik scarf, coffee, postcard");
    await expect(canvas.getByLabelText("Budget note")).toHaveValue("MYR 180 shared gift cap");
    await expect(canvas.getByLabelText("Tax refund note")).toHaveValue("Keep receipts above threshold");
  },
};

export const Mobile: Story = {
  args: Create.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /Add activity/i })).toHaveClass("stop-dialog");
    await expect(canvas.getByRole("textbox", { name: /^Activity$/i })).toBeVisible();
  },
};

export const Tablet: Story = {
  args: Create.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: Create.play,
};

export const Desktop1024: Story = {
  args: Edit.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: Edit.play,
};

export const Desktop1440: Story = {
  args: Edit.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: Edit.play,
};

export const Thai: Story = {
  args: Edit.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /แก้ไขรายละเอียด/i })).toBeVisible();
  },
};
