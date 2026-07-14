/* eslint-disable @typescript-eslint/no-empty-function */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FlexibleHunterPage } from "../FlexibleHunterPage";
import type { Trip } from "@/src/trip/types";

const mockTrip: Trip = {
  id: "trip-1",
  joinId: "join-1",
  joinPasswordHash: "hash",
  name: "Tokyo Trip",
  destinationLabel: "Tokyo, Japan",
  startDate: "2026-03-15",
  endDate: "2026-03-22",
  activePlanVariantId: "pv-1",
  planVariants: [],
  members: [{ id: "m1", displayName: "Owner", role: "owner", presence: "online", color: "#4a90e2" }],
  itineraryItems: [],
  expenses: [],
};

const noopDateChange = (() => {}) as (start: string, end: string) => void;
const noopBudgetEdit = (() => {}) as (id: string, updates: { estimated: number }) => void;

const meta = {
  title: "Design System/Flexible Hunter Page",
  component: FlexibleHunterPage,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
  args: {
    onDateWindowChange: noopDateChange,
    onBudgetEdit: noopBudgetEdit,
  },
  argTypes: {
    onDateWindowChange: { action: "onDateWindowChange" },
    onBudgetEdit: { action: "onBudgetEdit" },
  },
} satisfies Meta<typeof FlexibleHunterPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDateWindow: Story = {
  args: {
    trip: {
      ...mockTrip,
      dateWindowStart: "2026-03-01",
      dateWindowEnd: "2026-04-30",
    },
  },
};

export const WithBudgetCategories: Story = {
  args: {
    trip: {
      ...mockTrip,
      dateWindowStart: "2026-03-01",
      dateWindowEnd: "2026-04-30",
      budgetCategories: [
        { id: "bc-1", tripId: "trip-1", category: "Flight", estimated: 15000, actual: 2000 },
        { id: "bc-2", tripId: "trip-1", category: "Stay", estimated: 12000, actual: 4500 },
        { id: "bc-3", tripId: "trip-1", category: "Food", estimated: 8000, actual: 3000 },
        { id: "bc-4", tripId: "trip-1", category: "Activities", estimated: 10000, actual: 1500 },
      ],
    },
  },
};

export const ApproachingBudget: Story = {
  args: {
    trip: {
      ...mockTrip,
      dateWindowStart: "2026-03-01",
      dateWindowEnd: "2026-04-30",
      budgetCategories: [
        { id: "bc-1", tripId: "trip-1", category: "Flight", estimated: 15000, actual: 14000 },
        { id: "bc-2", tripId: "trip-1", category: "Stay", estimated: 12000, actual: 10500 },
        { id: "bc-3", tripId: "trip-1", category: "Food", estimated: 8000, actual: 7000 },
      ],
    },
  },
};

export const NoCategoriesEmpty: Story = {
  args: {
    trip: {
      ...mockTrip,
      dateWindowStart: "2026-03-01",
      dateWindowEnd: "2026-04-30",
    },
  },
};

export const Thai: Story = {
  args: {
    trip: {
      ...mockTrip,
      dateWindowStart: "2026-03-01",
      dateWindowEnd: "2026-04-30",
      budgetCategories: [
        { id: "bc-1", tripId: "trip-1", category: "Flight", estimated: 15000, actual: 2000 },
        { id: "bc-2", tripId: "trip-1", category: "Stay", estimated: 12000, actual: 4500 },
      ],
    },
  },
  parameters: { locale: "th" },
};
