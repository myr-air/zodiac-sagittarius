import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { messages } from "@/src/i18n/messages";
import { SmartItineraryTableHead } from "./SmartItineraryTableHead";

const meta = {
  title: "Features/Itinerary/SmartItineraryTableHead",
  component: SmartItineraryTableHead,
  parameters: { layout: "centered" },
  args: {
    labels: messages.en.itinerary.headers,
  },
} satisfies Meta<typeof SmartItineraryTableHead>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[720px]">
      <table>
        <SmartItineraryTableHead {...args} />
      </table>
    </div>
  ),
};
