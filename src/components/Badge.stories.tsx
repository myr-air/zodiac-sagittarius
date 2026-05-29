import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge, Panel } from "./ui";

const meta = {
  title: "Design System/Badges",
  component: Badge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { tone: "primary", children: "กำลังวางแผน" } };
export const Route: Story = { args: { tone: "route", children: "Route" } };
export const Warning: Story = { args: { tone: "warning", children: "ต้องคุยกัน" } };

export const Gallery: Story = {
  args: { tone: "neutral", children: "Gallery" },
  render: () => (
    <Panel>
      <Badge tone="primary">กำลังวางแผน</Badge>
      <Badge tone="route">Route</Badge>
      <Badge tone="warning">ต้องคุยกัน</Badge>
      <Badge tone="success">พร้อมแล้ว</Badge>
    </Panel>
  ),
};
