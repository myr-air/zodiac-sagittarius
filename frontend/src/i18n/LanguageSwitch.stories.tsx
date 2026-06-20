import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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

export const Default: Story = {
  play: defaultPlay,
};

export const ThaiSelected: Story = {
  play: thaiSelectedPlay,
};

export const CompactRail: Story = {
  args: { className: "side-rail-language" },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
