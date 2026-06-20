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
import {
  argsStory,
  viewportStory,
} from "./itinerary-story-builders";

const meta = {
  title: "Pages/Stop Dialog",
  component: StopDialog,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof StopDialog>;

export default meta;

type Story = StoryObj<typeof meta>;
const baseStory = argsStory<Story>;
const viewportStoryForBase = viewportStory<Story>;

export const Create: Story = {
  args: stopDialogCreateArgs,
  play: createPlay,
};

export const Edit: Story = {
  args: stopDialogEditArgs,
  play: editPlay,
};

export const AmbiguousPlace: Story = baseStory(Create.args, {
  placeResolution: ambiguousPlaceResolution,
}, ambiguousPlacePlay);

export const TransportationForm: Story = baseStory(Edit.args, {
  initialItem: transportationStoryItem,
}, transportationFormPlay);

export const ActivityForm: Story = baseStory(Edit.args, {
  initialItem: activityStoryItem,
}, activityFormPlay);

export const FoodForm: Story = baseStory(Edit.args, {
  initialItem: foodStoryItem,
}, foodFormPlay);

export const StayForm: Story = baseStory(Edit.args, {
  initialItem: stayStoryItem,
}, stayFormPlay);

export const ShoppingForm: Story = baseStory(Edit.args, {
  initialItem: shoppingStoryItem,
}, shoppingFormPlay);

export const NoteTaskForm: Story = baseStory(Edit.args, {
  initialItem: noteTaskStoryItem,
}, noteTaskFormPlay);

export const Mobile: Story = viewportStoryForBase(Create.args, "mobile320", createPlay);

export const Tablet: Story = viewportStoryForBase(Create.args, "tablet768", Create.play);

export const Desktop1024: Story = viewportStoryForBase(
  Edit.args,
  "desktop1024",
  Edit.play,
);

export const Desktop1440: Story = viewportStoryForBase(
  Edit.args,
  "desktop1440",
  Edit.play,
);

export const Thai: Story = {
  args: Edit.args,
  parameters: { locale: "th" },
  play: thaiPlay,
};
