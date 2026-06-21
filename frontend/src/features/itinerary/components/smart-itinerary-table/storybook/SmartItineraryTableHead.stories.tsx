import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { messages } from "@/src/i18n/messages";
import { SmartItineraryTableHead } from "../SmartItineraryTableHead";
import { SmartItineraryStoryFrame } from "./smart-itinerary-story-frame";

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
    <SmartItineraryStoryFrame size="table">
      <table>
        <SmartItineraryTableHead {...args} />
      </table>
    </SmartItineraryStoryFrame>
  ),
};
