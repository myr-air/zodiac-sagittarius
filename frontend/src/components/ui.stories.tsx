import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Icon } from "./icons";
import { Button, IconButton } from "./ui";

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
export const Disabled: ButtonStory = { args: { children: "กำลังบันทึก", variant: "primary", disabled: true } };
export const LongThaiLabel: ButtonStory = {
  args: { children: "บันทึกแผนทริปทั้งหมดให้เพื่อนเห็นพร้อมกัน", variant: "secondary" },
};
export const Mobile: ButtonStory = {
  args: { children: "เปิดทริป", variant: "primary" },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
export const CssCheck: ButtonStory = {
  args: { children: "Submit", variant: "primary" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: /submit/i });
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim();
    const expected = primaryColor.match(/^#([0-9a-f]{6})$/i);
    if (expected === null) {
      throw new Error("--color-primary is not a valid hex color token");
    }
    const red = Number.parseInt(expected[1].slice(0, 2), 16);
    const green = Number.parseInt(expected[1].slice(2, 4), 16);
    const blue = Number.parseInt(expected[1].slice(4, 6), 16);
    await expect(getComputedStyle(button).backgroundColor).toBe(`rgb(${red}, ${green}, ${blue})`);
  },
};

export const IconOnly: ButtonStory = {
  render: () => (
    <IconButton aria-label="เปิดรายละเอียด">
      <Icon name="panel" />
    </IconButton>
  ),
};
