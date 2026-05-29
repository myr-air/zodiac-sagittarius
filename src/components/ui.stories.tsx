import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Button } from "./ui";

const buttonsMeta = {
  title: "Design System/Buttons",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Button>;

export default buttonsMeta;

type ButtonStory = StoryObj<typeof buttonsMeta>;

export const Primary: ButtonStory = { args: { children: "วางแผนทริป", variant: "primary" } };
export const Secondary: ButtonStory = { args: { children: "ดูรายละเอียด", variant: "secondary" } };
export const Ghost: ButtonStory = { args: { children: "ยกเลิก", variant: "ghost" } };
export const Danger: ButtonStory = { args: { children: "ลบรายการ", variant: "danger" } };
export const Mobile: ButtonStory = {
  args: { children: "เปิดทริป", variant: "primary" },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
export const CssCheck: ButtonStory = {
  args: { children: "Submit", variant: "primary" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: /submit/i });
    await expect(getComputedStyle(button).backgroundColor).toBe("rgb(15, 118, 110)");
  },
};
