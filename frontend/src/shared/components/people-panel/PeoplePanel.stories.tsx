import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PeoplePanel } from "./PeoplePanel";
import { emptyPlay, managerPlay, readOnlyPlay } from "./PeoplePanel.stories.plays";
import {
  emptyPeoplePanelStoryArgs,
  managerPeoplePanelStoryArgs,
  readOnlyPeoplePanelStoryArgs,
} from "./PeoplePanel.stories.support";

const meta = {
  title: "Design System/People Panel",
  component: PeoplePanel,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof PeoplePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Manager: Story = {
  args: managerPeoplePanelStoryArgs,
  play: managerPlay,
};

export const ReadOnly: Story = {
  args: readOnlyPeoplePanelStoryArgs,
  play: readOnlyPlay,
};

export const Empty: Story = {
  parameters: { locale: "th" },
  args: emptyPeoplePanelStoryArgs,
  play: emptyPlay,
};
