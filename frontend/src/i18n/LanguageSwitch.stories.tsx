import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { viewportStory } from "@/src/shared/storybook/story-builders";
import { LanguageSwitch } from "./LanguageSwitch";
import { defaultPlay, thaiSelectedPlay } from "./LanguageSwitch.stories.plays";

const meta = {
  title: "Design System/Language Switch",
  component: LanguageSwitch,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof LanguageSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;
const languageViewportStory = viewportStory<Story>;

export const Default: Story = {
  play: defaultPlay,
};

export const ThaiSelected: Story = {
  play: thaiSelectedPlay,
};

export const CompactRail: Story = languageViewportStory(
  { className: "side-rail-language" },
  "mobile320",
  undefined,
);
