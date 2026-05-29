import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./ui";

const buttonsMeta = {
  title: "Design System/Buttons",
  component: Button,
  parameters: { layout: "centered" },
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
