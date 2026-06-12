import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { LanguageSwitch } from "./LanguageSwitch";

const meta = {
  title: "Design System/Language Switch",
  component: LanguageSwitch,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof LanguageSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Language and currency" })).toHaveTextContent("EN / HKD");
  },
};

export const ThaiSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Language and currency" }));
    await userEvent.click(canvas.getByRole("menuitemradio", { name: "ภาษาไทย" }));
    await expect(canvas.getByRole("button", { name: "ภาษาและสกุลเงิน" })).toHaveTextContent("TH / HKD");
  },
};

export const CompactRail: Story = {
  args: { className: "side-rail-language" },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
