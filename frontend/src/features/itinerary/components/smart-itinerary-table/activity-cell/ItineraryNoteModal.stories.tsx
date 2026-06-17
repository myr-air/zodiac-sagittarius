import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { ItineraryNoteModal } from "./ItineraryNoteModal";

const meta = {
  title: "Features/Itinerary/ItineraryNoteModal",
  component: ItineraryNoteModal,
  parameters: { layout: "centered" },
  args: {
    item: tripFixture.planItems[0],
    locale: "en",
    onClose: () => {},
    onSave: () => {},
  },
  argTypes: {
    locale: {
      control: "inline-radio",
      options: ["en", "th"],
      description: "Locale used for modal copy",
    },
  },
} satisfies Meta<typeof ItineraryNoteModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => (
    <div className="fixed inset-0 bg-black/5">
      <ItineraryNoteModal {...args} />
    </div>
  ),
};
