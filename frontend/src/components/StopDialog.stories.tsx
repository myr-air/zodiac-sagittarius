import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { StopDialog } from "./StopDialog";

const noop = () => {};

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

export const Mobile: Story = {
  args: Create.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

export const Thai: Story = {
  args: Edit.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /แก้ไขรายละเอียด/i })).toBeVisible();
  },
};
