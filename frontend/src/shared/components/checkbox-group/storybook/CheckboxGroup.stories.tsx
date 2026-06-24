import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckboxGroup } from "../CheckboxGroup";

const travelerOptions = [
  { id: "member-aom", label: "Aom" },
  { id: "member-beam", label: "Beam" },
  { id: "member-kai", label: "Kai" },
  { id: "member-nam", label: "Nam" },
  { id: "member-pim", label: "Pim" },
];

const itineraryOptions = [
  { id: "stop-peak", label: "1 - Victoria Peak lookout" },
  { id: "stop-ferry", label: "2 - Star Ferry crossing" },
  { id: "stop-market", label: "3 - Temple Street market" },
  { id: "stop-dinner", label: "4 - Group dinner booking" },
  { id: "stop-checkin", label: "5 - Hotel check-in" },
];

const meta = {
  title: "Shared/CheckboxGroup",
  component: CheckboxGroup,
  parameters: { layout: "centered" },
  args: {
    label: "Travelers",
    options: travelerOptions,
    selectedIds: ["member-aom", "member-kai"],
    maxHeightClassName: "max-h-36",
    onToggle: () => undefined,
  },
  render: function CheckboxGroupStory(args) {
    return (
      <div className="w-[280px]">
        <CheckboxGroup {...args} />
      </div>
    );
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Travelers: Story = {};

export const RelatedItinerary: Story = {
  args: {
    label: "Related itinerary",
    options: itineraryOptions,
    selectedIds: ["stop-peak", "stop-dinner"],
    maxHeightClassName: "max-h-48",
  },
};
