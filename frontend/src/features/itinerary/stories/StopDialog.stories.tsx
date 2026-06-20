import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StopDialog } from "@/src/features/itinerary/components";
import {
  activityFormPlay,
  ambiguousPlacePlay,
  createPlay,
  editPlay,
  foodFormPlay,
  noteTaskFormPlay,
  shoppingFormPlay,
  stayFormPlay,
  thaiPlay,
  transportationFormPlay,
} from "./StopDialog.stories.plays";
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
  play: createPlay,
};

export const Edit: Story = {
  args: stopDialogEditArgs,
  play: editPlay,
};

export const AmbiguousPlace: Story = {
  args: {
    ...Create.args,
    placeResolution: ambiguousPlaceResolution,
  },
  play: ambiguousPlacePlay,
};

export const TransportationForm: Story = {
  args: {
    ...Edit.args,
    initialItem: transportationStoryItem,
  },
  play: transportationFormPlay,
};

export const ActivityForm: Story = {
  args: {
    ...Edit.args,
    initialItem: activityStoryItem,
  },
  play: activityFormPlay,
};

export const FoodForm: Story = {
  args: {
    ...Edit.args,
    initialItem: foodStoryItem,
  },
  play: foodFormPlay,
};

export const StayForm: Story = {
  args: {
    ...Edit.args,
    initialItem: stayStoryItem,
  },
  play: stayFormPlay,
};

export const ShoppingForm: Story = {
  args: {
    ...Edit.args,
    initialItem: shoppingStoryItem,
  },
  play: shoppingFormPlay,
};

export const NoteTaskForm: Story = {
  args: {
    ...Edit.args,
    initialItem: noteTaskStoryItem,
  },
  play: noteTaskFormPlay,
};

export const Mobile: Story = {
  args: Create.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: createPlay,
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
  play: thaiPlay,
};
