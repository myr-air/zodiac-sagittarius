import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { StopDialog } from "@/src/features/itinerary/components";
import {
  activityStoryItem,
  ambiguousPlaceResolution,
  foodStoryItem,
  noteTaskStoryItem,
  shoppingStoryItem,
  stayStoryItem,
  stopDialogCreateArgs,
  stopDialogEditArgs,
  transportationStoryItem,
} from "./StopDialog.stories.support";

const meta = {
  title: "Pages/Stop Dialog",
  component: StopDialog,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof StopDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: stopDialogCreateArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /Add activity/i })).toHaveClass("stop-dialog");
    await expect(canvas.getByRole("textbox", { name: /^Activity$/i })).toBeVisible();
  },
};

export const Edit: Story = {
  args: stopDialogEditArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("dialog", { name: /Edit details/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Delete stop/i })).toBeVisible();
  },
};

export const AmbiguousPlace: Story = {
  args: {
    ...Create.args,
    placeResolution: ambiguousPlaceResolution,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Central Market Kuala Lumpur/i)).toBeVisible();
    await expect(canvas.getByText(/Central Market Annexe/i)).toBeVisible();
  },
};

export const TransportationForm: Story = {
  args: {
    ...Edit.args,
    initialItem: transportationStoryItem,
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
    initialItem: activityStoryItem,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("experience");
    await expect(canvas.getByLabelText("Provider")).toHaveValue("Central Market");
    await expect(canvas.getByLabelText("Meeting point")).toHaveValue("South entrance");
    await expect(canvas.getByLabelText("Booking ref")).toHaveValue("Lunch shortlist");
    await expect(canvas.queryByLabelText("Transportation")).not.toBeInTheDocument();
  },
};

export const FoodForm: Story = {
  args: {
    ...Edit.args,
    initialItem: foodStoryItem,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("experience");
    await expect(canvas.getByLabelText("Provider")).toHaveValue("Central Market");
    await expect(canvas.getByLabelText("Booking ref")).toHaveValue("Lunch shortlist");
  },
};

export const StayForm: Story = {
  args: {
    ...Edit.args,
    initialItem: stayStoryItem,
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
    initialItem: shoppingStoryItem,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("experience");
    await expect(canvas.getByLabelText("Provider")).toHaveValue("");
    await expect(canvas.getByLabelText("Booking ref")).toHaveValue("");
  },
};

export const NoteTaskForm: Story = {
  args: {
    ...Edit.args,
    initialItem: noteTaskStoryItem,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Type")).toHaveValue("task");
    await expect(canvas.getByLabelText("Detail")).toHaveValue("Check passenger names before ticket issue");
    await expect(canvas.getByLabelText("Related place")).toHaveValue("Shared booking sheet");
    await expect(canvas.getByText("More details")).toBeVisible();
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
