import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DreamerPage } from "../DreamerPage";
import type { Trip } from "@/src/trip/types";

const mockTrip: Trip = {
  id: "trip-1",
  joinId: "join-1",
  joinPasswordHash: "hash",
  name: "Tokyo Dream",
  destinationLabel: "Tokyo, Japan",
  startDate: "2026-03-15",
  endDate: "2026-03-22",
  activePlanVariantId: "pv-1",
  planVariants: [],
  members: [{ id: "m1", tripId: "trip-1", name: "Owner", role: "owner" } as any],
  itineraryItems: [],
  expenses: [],
};

const meta = {
  title: "Design System/Dreamer Page",
  component: DreamerPage,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
  argTypes: { onStartPlanning: { action: "onStartPlanning" } },
} satisfies Meta<typeof DreamerPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewDreamer: Story = {
  args: { trip: mockTrip, onStartPlanning: () => {} },
};

export const WithRoughMonth: Story = {
  args: {
    trip: { ...mockTrip, dateWindowStart: "2026-04-01" },
    onStartPlanning: () => {},
  },
};

export const Thai: Story = {
  args: { trip: mockTrip, onStartPlanning: () => {} },
  parameters: { locale: "th" },
};
