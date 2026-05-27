import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SagittariusApp } from "./SagittariusApp";

const meta = {
  title: "Sagittarius/App",
  component: SagittariusApp,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SagittariusApp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {};
