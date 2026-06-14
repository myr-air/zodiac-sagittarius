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

export const ActivityForm: Story = {
  args: {
    ...Edit.args,
    initialItem: categoryItem({
      activity: "Dim sum lunch",
      activityType: "experience",
      itemKind: "activity",
      place: "Central Market",
      details: {
        kind: "experience",
        provider: "Central Market",
        meetingPoint: "South entrance",
        bookingRef: "Lunch shortlist",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("experience");
    await expect(canvas.getByLabelText("Provider")).toHaveValue("Central Market");
    await expect(canvas.getByLabelText("Meeting point")).toHaveValue("South entrance");
    await expect(canvas.getByLabelText("Booking ref")).toHaveValue("Lunch shortlist");
    await expect(canvas.getByLabelText("Transportation")).toBeVisible();
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
        provider: "Central Market",
        cuisine: "Cantonese dim sum",
        bookingRef: "Lunch shortlist",
        costNote: "HKD 160 per person estimate",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("food");
    await expect(canvas.getByLabelText("Restaurant / vendor")).toHaveValue("Central Market");
    await expect(canvas.getByLabelText("Cuisine / menu")).toHaveValue("Cantonese dim sum");
    await expect(canvas.getByLabelText("Booking ref")).toHaveValue("Lunch shortlist");
    await expect(canvas.getByLabelText("Cost note")).toHaveValue("HKD 160 per person estimate");
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
      activity: "Sneaker stop",
      activityType: "shopping",
      itemKind: "activity",
      place: "Mong Kok",
      details: {
        kind: "shopping",
        store: "Sneaker Street",
        shoppingList: "Limited colorways, socks, gifts",
        budgetNote: "Cap group browsing at 45 minutes",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("shopping");
    await expect(canvas.getByLabelText("Store / area")).toHaveValue("Sneaker Street");
    await expect(canvas.getByLabelText("Shopping list")).toHaveValue("Limited colorways, socks, gifts");
    await expect(canvas.getByLabelText("Budget / time note")).toHaveValue("Cap group browsing at 45 minutes");
  },
};

export const NoteTaskForm: Story = {
  args: {
    ...Edit.args,
    initialItem: categoryItem({
      activity: "Confirm voucher names",
      activityType: "experience",
      itemKind: "note",
      timeMode: "flexible",
      place: "Central Market",
      details: {
        kind: "task",
        detail: "Check passenger names before ticket issue",
        meetingPoint: "Shared booking sheet",
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("task");
    await expect(canvas.getByLabelText("Detail")).toHaveValue("Check passenger names before ticket issue");
    await expect(canvas.getByLabelText("Related place")).toHaveValue("Shared booking sheet");
    await expect(canvas.getByText("More options")).toBeVisible();
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
