import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Badge, Panel } from "./ui";

const meta = {
  title: "Design System/Badges",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: "neutral", children: "Draft" } };
export const Primary: Story = { args: { tone: "primary", children: "กำลังวางแผน" } };
export const Route: Story = { args: { tone: "route", children: "Route" } };
export const Warning: Story = { args: { tone: "warning", children: "ต้องคุยกัน" } };
export const Success: Story = { args: { tone: "success", children: "พร้อมแล้ว" } };
export const Danger: Story = { args: { tone: "danger", children: "ปิดใช้งาน" } };
export const LongThaiLabel: Story = { args: { tone: "warning", children: "ต้องตรวจข้อมูลการจองก่อนแชร์ให้เพื่อน" } };

export const Gallery: Story = {
  args: { tone: "neutral", children: "Gallery" },
  render: () => (
    <Panel>
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="primary">กำลังวางแผน</Badge>
      <Badge tone="route">Route</Badge>
      <Badge tone="warning">ต้องคุยกัน</Badge>
      <Badge tone="success">พร้อมแล้ว</Badge>
      <Badge tone="danger">ปิดใช้งาน</Badge>
    </Panel>
  ),
  play: async ({ canvas }) => {
    const badge = canvas.getByText("พร้อมแล้ว");
    await expect(badge).toHaveClass("badge--success");
    await expect(badge).toHaveClass("bg-[var(--color-success-soft)]");
  },
};
