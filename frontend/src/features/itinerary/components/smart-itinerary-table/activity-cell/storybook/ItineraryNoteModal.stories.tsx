import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import { ItineraryNoteModal } from "../ItineraryNoteModal";

const noteItem = buildItineraryItem();

const meta = {
  title: "Features/Itinerary/ItineraryNoteModal",
  component: ItineraryNoteModal,
  parameters: { layout: "centered" },
  args: {
    item: noteItem,
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
